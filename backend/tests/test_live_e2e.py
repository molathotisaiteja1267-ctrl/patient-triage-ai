import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests
import json

BASE = 'http://127.0.0.1:8000/api'

def run_live_tests():
    # Purge db first for clean run
    from app.database import init_db, purge_all_data
    init_db()
    purge_all_data()

    print('--- TEST 1: REGISTER HOSPITAL ---')
    reg_payload = {
        'hospital_name': 'ApexCare Medical Center',
        'hospital_type': 'Hospital',
        'hospital_address': '100 Health Park Blvd',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'country': 'India',
        'contact_email': 'contact@apexcare.example',
        'contact_phone': '+91 98765 43210',
        'hospital_code': 'AC',
        'admin_name': 'Dr. Arjun Mehta',
        'admin_email': 'admin@apexcare.example',
        'password': 'ApexCare@2026!',
        'confirm_password': 'ApexCare@2026!'
    }
    r1 = requests.post(f'{BASE}/auth/register-hospital', json=reg_payload)
    print('Registration Status:', r1.status_code)
    assert r1.status_code == 201, r1.text
    data1 = r1.json()
    print('Hospital Created:', data1['hospital']['name'], 'Code:', data1['hospital']['code'])

    print('\n--- TEST 2: DUPLICATE CODE CHECK ---')
    r2 = requests.post(f'{BASE}/auth/register-hospital', json=reg_payload)
    print('Duplicate Status:', r2.status_code, 'Error:', r2.json())
    assert r2.status_code == 409

    print('\n--- TEST 3 & 5: LOGIN WITH WRONG PASSWORD ---')
    r_wrong = requests.post(f'{BASE}/auth/login', json={
        'hospital_code': 'AC',
        'email': 'admin@apexcare.example',
        'password': 'WrongPassword123!'
    })
    print('Wrong Password Status:', r_wrong.status_code, 'Error:', r_wrong.json())
    assert r_wrong.status_code == 401

    print('\n--- TEST 6: LOGIN WITH CORRECT CREDENTIALS ---')
    r_login = requests.post(f'{BASE}/auth/login', json={
        'hospital_code': 'AC',
        'email': 'admin@apexcare.example',
        'password': 'ApexCare@2026!'
    })
    print('Login Status:', r_login.status_code)
    assert r_login.status_code == 200
    admin_auth = r_login.json()
    admin_token = admin_auth['access_token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    print('Logged in as:', admin_auth['user']['name'], 'Role:', admin_auth['user']['role'])

    print('\n--- TEST 7: CREATE STAFF (Nisha Reddy) ---')
    r_dept = requests.post(f'{BASE}/hospital/departments', headers=admin_headers, json={'department_name': 'Emergency Department'})
    r_invite = requests.post(f'{BASE}/auth/invite-staff', headers=admin_headers, json={
        'name': 'Nisha Reddy',
        'email': 'nisha.reddy@apexcare.example',
        'role': 'TRIAGE_NURSE',
        'department': 'Emergency Department'
    })
    print('Staff Invite Status:', r_invite.status_code)
    assert r_invite.status_code == 200
    token_str = r_invite.json()['token']

    # Staff registers
    r_reg_staff = requests.post(f'{BASE}/auth/register-staff', json={
        'token': token_str,
        'name': 'Nisha Reddy',
        'email': 'nisha.reddy@apexcare.example',
        'password': 'NursePassword2026!',
        'confirm_password': 'NursePassword2026!'
    })
    print('Staff Registered Status:', r_reg_staff.status_code)
    assert r_reg_staff.status_code == 201

    print('\n--- TEST 8: STAFF LOGIN ---')
    r_nurse_login = requests.post(f'{BASE}/auth/login', json={
        'hospital_code': 'AC',
        'email': 'nisha.reddy@apexcare.example',
        'password': 'NursePassword2026!'
    })
    print('Nurse Login Status:', r_nurse_login.status_code)
    assert r_nurse_login.status_code == 200
    nurse_auth = r_nurse_login.json()
    nurse_headers = {'Authorization': f"Bearer {nurse_auth['access_token']}"}
    print('Nurse Logged In:', nurse_auth['user']['name'], 'Role:', nurse_auth['user']['role'])
    assert nurse_auth['user']['role'] == 'TRIAGE_NURSE'

    print('\n--- TEST 9: REGISTER PATIENT (Rahul Verma) ---')
    r_patient = requests.post(f'{BASE}/patients', headers=nurse_headers, json={
        'name': 'Rahul Verma',
        'dob': '1981-05-12',
        'age': 45,
        'sex': 'Male',
        'phone': '+91 98111 22233',
        'blood_group': 'B+',
        'department': 'Emergency Medicine'
    })
    print('Patient Registration Status:', r_patient.status_code)
    assert r_patient.status_code == 201
    pid = r_patient.json()['patient_id']
    print('Patient Created with Sequential Deterministic ID:', pid)
    assert pid == 'AC-2026-000001'

    print('\n--- TEST 10 & 11: GET PATIENT PROFILE ---')
    r_profile = requests.get(f'{BASE}/patients/{pid}', headers=nurse_headers)
    print('Get Profile Status:', r_profile.status_code)
    assert r_profile.status_code == 200
    prof = r_profile.json()
    assert prof['patient']['name'] == 'Rahul Verma'

    print('\n--- TEST 12 & 13: SUBMIT TRIAGE ---')
    r_triage = requests.post(f'{BASE}/patients/{pid}/triage?decision_type=ACCEPTED', headers=nurse_headers, json={
        'patient_id': pid,
        'age': 45,
        'sex': 'Male',
        'arrival_method': 'Walk-in',
        'chief_complaint': 'Acute chest tightness and diaphoresis',
        'symptoms': {'main_symptoms': ['Chest tightness'], 'severity': 8, 'onset': 'Sudden'},
        'red_flags': {'severe_chest_pain': 'Yes', 'severe_dyspnea': 'Yes'},
        'vitals': {'heart_rate': 110, 'spo2': 94.0, 'systolic_bp': 145, 'diastolic_bp': 90}
    })
    print('Triage Status:', r_triage.status_code)
    assert r_triage.status_code == 200
    triage_data = r_triage.json()
    print('Triage Priority:', triage_data['priority'], 'Recommended Route:', triage_data['recommended_route'])
    assert triage_data['priority'] in ('RED', 'ORANGE')

    print('\n--- TEST QUEUE UPDATE ---')
    r_queue = requests.get(f'{BASE}/hospital/triage-queue', headers=nurse_headers)
    assert r_queue.status_code == 200
    queue = r_queue.json()
    assert any(q['patient_id'] == pid for q in queue)
    print('Patient found in Active Triage Queue! Queue size:', len(queue))
    print('\n>>> ALL 13 END-TO-END ACCEPTANCE TESTS PASSED AGAINST LIVE BACKEND! <<<')

if __name__ == '__main__':
    run_live_tests()
