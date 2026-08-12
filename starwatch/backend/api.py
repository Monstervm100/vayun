"""
api.py — FastAPI backend implementing FR5.1-FR5.6 (SRD Module 5)
Design reference: STARWATCH_Design_Document.md Section 3.5

Endpoint contracts already exercised by frontend-demo/js/mockApi.js:
  GET  /satellites/{id}/status         FR5.1  (TC-P08, TC-N01)
  GET  /events                         FR5.2
  GET  /alerts/{event_id}/explanation  FR5.3  (TC-N10)
  POST /simulate/scenario              FR5.4  (TC-P09, TC-N04)
  WS   /live                           FR5.5  (TC-P09, TC-N07)
  GET  /docs                           FR5.6  (free with FastAPI)
"""
