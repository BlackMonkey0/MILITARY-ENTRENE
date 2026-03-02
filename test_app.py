import os
import json
import tempfile

import pytest
from app import app, DATA_FILE, load_state, save_state

@pytest.fixture(autouse=True)
def clean_state(tmp_path, monkeypatch):
    # override DATA_FILE to a temp file during tests
    monkeypatch.setattr('app.DATA_FILE', str(tmp_path / 'state.json'))
    yield

client = app.test_client()

def test_status_endpoint():
    resp = client.get('/api/status')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'status' in data and 'ia_level' in data

def test_exercise_and_state():
    # start with empty state
    s = load_state()
    assert s['reps'] == 0
    # post exercise
    r = client.post('/api/exercise', json={'qty': 10, 'time': '12:00'})
    assert r.status_code == 200
    data = r.get_json()
    assert data['reps'] == 10
    assert any(entry['qty'] == 10 for entry in data.get('history', []))

def test_food_and_water():
    client.post('/api/food', json={'cal': 300, 'p': 20, 'ch': 40})
    s = load_state()
    assert s['calories'] >= 300
    client.post('/api/water', json={'water': 250})
    s = load_state()
    assert s['water'] >= 250

def test_post_state_updates_bodystats():
    resp = client.post('/api/state', json={'bodyStats': {'weight': 65, 'bmi': 21}})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'bodyStats' in data and data['bodyStats']['weight'] == 65

def test_settings_merge():
    resp = client.post('/api/state', json={'user': {'baseCalories': 3000}, 'daily': {'missionGoal': 200}})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('user', {}).get('baseCalories') == 3000
    assert data.get('daily', {}).get('missionGoal') == 200
