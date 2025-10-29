from flask import Flask, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

@app.route("/api/earthquakes")
def get_earthquakes():
    try:
        response = requests.get(USGS_URL)
        data = response.json()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Failed to fetch earthquake data", "details": str(e)}), 500

# No app.run() block needed — Gunicorn will serve this app
