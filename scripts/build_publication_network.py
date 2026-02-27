"""
Build a citation network for the lab's publications using Crossref and OpenCitations.

This script:
- Reads DOIs from public/data/publications.json
- Uses Crossref to get references cited by each article
- Uses OpenCitations COCI API to get articles that cite each DOI
- Writes a network.json file in public/data/network.json with nodes and links

Usage (from repo root):
    python scripts/build_publication_network.py

Dependencies:
    pip install requests
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Dict, List, Set, Any

import requests


ROOT = Path(__file__).resolve().parents[1]
PUBLICATIONS_PATH = ROOT / "public" / "data" / "publications.json"
OUTPUT_PATH = ROOT / "public" / "data" / "network.json"

CROSSREF_BASE = "https://api.crossref.org/works"
OPENCITATIONS_BASE = "https://opencitations.net/index/coci/api/v1"


def load_own_dois() -> List[str]:
  """Load DOIs for own publications from publications.json."""
  with PUBLICATIONS_PATH.open("r", encoding="utf-8") as f:
    data = json.load(f)

  dois: List[str] = []
  for pub in data.get("publications", []):
    doi = pub.get("doi")
    if isinstance(doi, str) and doi.strip():
      dois.append(doi.strip())
  return sorted(set(dois))


def safe_get(url: str, params: Dict[str, Any] | None = None, sleep: float = 0.2) -> Any:
  """Wrapper around requests.get with basic error handling and polite delay."""
  try:
    resp = requests.get(url, params=params, timeout=15)
    if sleep:
      time.sleep(sleep)
    if resp.status_code != 200:
      return None
    return resp.json()
  except Exception:
    return None


def fetch_crossref_metadata(doi: str) -> Dict[str, Any]:
  """Fetch minimal metadata (title, year, references) from Crossref."""
  url = f"{CROSSREF_BASE}/{requests.utils.quote(doi)}"
  data = safe_get(url)
  if not data or "message" not in data:
    return {}

  msg = data["message"]
  title_list = msg.get("title") or []
  title = title_list[0] if title_list else doi

  year = None
  issued = msg.get("issued", {}).get("date-parts")
  if isinstance(issued, list) and issued and isinstance(issued[0], list) and issued[0]:
    year = issued[0][0]

  references = []
  for ref in msg.get("reference", []) or []:
    ref_doi = ref.get("DOI")
    if ref_doi:
      references.append(ref_doi.strip())

  return {
    "doi": doi,
    "title": title,
    "year": year,
    "references": references,
  }


def fetch_citations_from_opencitations(doi: str) -> List[str]:
  """
  Fetch DOIs of articles that cite the given DOI using OpenCitations COCI API.

  API docs: https://opencitations.net/index/coci/api/v1
  """
  url = f"{OPENCITATIONS_BASE}/citations/{requests.utils.quote(doi)}"
  data = safe_get(url)
  if not isinstance(data, list):
    return []

  citing_dois: List[str] = []
  for item in data:
    citing = item.get("citing")
    if citing:
      citing_dois.append(citing.strip())
  return citing_dois


def build_network() -> Dict[str, Any]:
  own_dois = load_own_dois()

  nodes: Dict[str, Dict[str, Any]] = {}
  links: List[Dict[str, Any]] = []

  # First, add own articles as nodes
  for doi in own_dois:
    nodes[doi] = {
      "id": doi,
      "label": doi,
      "type": "own",
    }

  # To avoid an explosion of requests, we cap how many external DOIs we enrich with metadata
  max_external_metadata = 60
  external_metadata_fetched: Set[str] = set()

  for idx, doi in enumerate(own_dois, start=1):
    print(f"[{idx}/{len(own_dois)}] Processing DOI: {doi}")

    meta = fetch_crossref_metadata(doi)
    if meta:
      # Update own node with title/year if available
      node = nodes.get(doi, {"id": doi, "type": "own"})
      node["label"] = meta.get("title") or doi
      if meta.get("year"):
        node["year"] = meta["year"]
      nodes[doi] = node

      # References: own -> reference
      for ref_doi in meta.get("references", []):
        if ref_doi not in nodes:
          nodes[ref_doi] = {
            "id": ref_doi,
            "label": ref_doi,
            "type": "reference",
          }
        links.append(
          {
            "source": doi,
            "target": ref_doi,
            "relation": "reference",
          }
        )

    # Cited-by: cited -> own
    citing_dois = fetch_citations_from_opencitations(doi)
    for citing in citing_dois:
      if citing not in nodes:
        nodes[citing] = {
          "id": citing,
          "label": citing,
          "type": "citedBy",
        }
      links.append(
        {
          "source": citing,
          "target": doi,
          "relation": "citedBy",
        }
      )

      # Optionally enrich some cited-by nodes with Crossref metadata
      if (
        len(external_metadata_fetched) < max_external_metadata
        and citing not in external_metadata_fetched
      ):
        meta_citing = fetch_crossref_metadata(citing)
        if meta_citing:
          node = nodes.get(citing, {"id": citing, "type": "citedBy"})
          node["label"] = meta_citing.get("title") or citing
          if meta_citing.get("year"):
            node["year"] = meta_citing["year"]
          nodes[citing] = node
          external_metadata_fetched.add(citing)

  print(f"Total nodes: {len(nodes)}")
  print(f"Total links: {len(links)}")

  return {
    "nodes": list(nodes.values()),
    "links": links,
  }


def main() -> None:
  if not PUBLICATIONS_PATH.exists():
    raise SystemExit(f"Publications file not found: {PUBLICATIONS_PATH}")

  network = build_network()
  OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
  with OUTPUT_PATH.open("w", encoding="utf-8") as f:
    json.dump(network, f, ensure_ascii=False, indent=2)

  print(f"Network written to {OUTPUT_PATH}")


if __name__ == "__main__":
  main()

