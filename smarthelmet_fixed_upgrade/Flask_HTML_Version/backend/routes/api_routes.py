from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db

bp = Blueprint('api', __name__, url_prefix='/api')

# User Management
@bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        users = list(db.users.find({}, {'passwordHash': 0}))
        for user in users:
            user['_id'] = str(user['_id'])
        return jsonify(users), 200
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    try:
        user = db.users.find_one({'_id': ObjectId(user_id)}, {'passwordHash': 0})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user['_id'] = str(user['_id'])
        return jsonify(user), 200
    except Exception as e:
        print(f"Error fetching user: {e}")
        return jsonify({'error': 'Failed to fetch user'}), 500

@bp.route('/users/<user_id>', methods=['PATCH'])
@jwt_required()
def update_user(user_id):
    try:
        data = request.get_json()
        update_fields = {}
        
        if 'emergencyContacts' in data:
            update_fields['emergencyContacts'] = data['emergencyContacts']
        if 'phone' in data:
            update_fields['phone'] = data['phone']
        if 'email' in data:
            update_fields['email'] = data['email']
        if 'assignedBikes' in data:
            update_fields['assignedBikes'] = data['assignedBikes']
        
        result = db.users.find_one_and_update(
            {'_id': ObjectId(user_id)},
            {'$set': update_fields},
            return_document=True,
            projection={'passwordHash': 0}
        )
        
        if result:
            result['_id'] = str(result['_id'])
            return jsonify(result), 200
        return jsonify({'error': 'User not found'}), 404
        
    except Exception as e:
        print(f"Error updating user: {e}")
        return jsonify({'error': 'Failed to update user'}), 500

# Bike Management
@bp.route('/bikes', methods=['GET'])
@jwt_required()
def get_bikes():
    try:
        bikes = list(db.bikes.find({}))
        for bike in bikes:
            bike['_id'] = str(bike['_id'])
            if 'ownerId' in bike and bike['ownerId']:
                owner = db.users.find_one({'_id': ObjectId(bike['ownerId'])}, {'username': 1, 'email': 1})
                if owner:
                    bike['ownerId'] = {
                        '_id': str(owner['_id']),
                        'username': owner.get('username'),
                        'email': owner.get('email')
                    }
        return jsonify(bikes), 200
    except Exception as e:
        print(f"Error fetching bikes: {e}")
        return jsonify({'error': 'Failed to fetch bikes'}), 500

@bp.route('/bikes/<bike_id>', methods=['GET'])
@jwt_required()
def get_bike(bike_id):
    try:
        bike = db.bikes.find_one({'bikeId': bike_id})
        if not bike:
            return jsonify({'error': 'Bike not found'}), 404
        bike['_id'] = str(bike['_id'])
        if 'ownerId' in bike and bike['ownerId']:
            owner = db.users.find_one({'_id': ObjectId(bike['ownerId'])}, {'username': 1, 'email': 1})
            if owner:
                bike['ownerId'] = {
                    '_id': str(owner['_id']),
                    'username': owner.get('username'),
                    'email': owner.get('email')
                }
        return jsonify(bike), 200
    except Exception as e:
        print(f"Error fetching bike: {e}")
        return jsonify({'error': 'Failed to fetch bike'}), 500

@bp.route('/bikes', methods=['POST'])
@jwt_required()
def create_bike():
    try:
        data = request.get_json()
        bike_doc = {
            'bikeId': data.get('bikeId'),
            'bikeName': data.get('bikeName', ''),
            'bikeModel': data.get('bikeModel', ''),
            'registrationNumber': data.get('registrationNumber', ''),
            'ownerId': data.get('ownerId'),
            'isActive': True,
            'ignitionBlocked': False,
            'createdAt': datetime.utcnow()
        }
        
        result = db.bikes.insert_one(bike_doc)
        bike_doc['_id'] = str(result.inserted_id)
        return jsonify(bike_doc), 201
        
    except Exception as e:
        print(f"Error creating bike: {e}")
        return jsonify({'error': 'Failed to create bike'}), 500

@bp.route('/bikes/<bike_id>', methods=['PATCH'])
@jwt_required()
def update_bike(bike_id):
    try:
        data = request.get_json()
        update_fields = {}
        
        if 'bikeName' in data:
            update_fields['bikeName'] = data['bikeName']
        if 'bikeModel' in data:
            update_fields['bikeModel'] = data['bikeModel']
        if 'registrationNumber' in data:
            update_fields['registrationNumber'] = data['registrationNumber']
        if 'ownerId' in data:
            update_fields['ownerId'] = data['ownerId']
        if 'isActive' in data:
            update_fields['isActive'] = data['isActive']
        
        result = db.bikes.find_one_and_update(
            {'bikeId': bike_id},
            {'$set': update_fields},
            return_document=True
        )
        
        if result:
            result['_id'] = str(result['_id'])
            return jsonify(result), 200
        return jsonify({'error': 'Bike not found'}), 404
        
    except Exception as e:
        print(f"Error updating bike: {e}")
        return jsonify({'error': 'Failed to update bike'}), 500

# Alerts
@bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    try:
        limit = int(request.args.get('limit', 50))
        bike_id = request.args.get('bikeId')
        
        query = {}
        if bike_id:
            query['bikeId'] = bike_id
        
        alerts = list(db.alerts.find(query).sort('timestamp', -1).limit(limit))
        for alert in alerts:
            alert['_id'] = str(alert['_id'])
        
        return jsonify(alerts), 200
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        return jsonify({'error': 'Failed to fetch alerts'}), 500

@bp.route('/alerts/<alert_id>/resolve', methods=['PATCH'])
@jwt_required()
def resolve_alert(alert_id):
    try:
        data = request.get_json()
        
        result = db.alerts.find_one_and_update(
            {'_id': ObjectId(alert_id)},
            {'$set': {
                'resolved': True,
                'resolvedAt': datetime.utcnow(),
                'resolvedBy': data.get('resolvedBy'),
                'notes': data.get('notes', '')
            }},
            return_document=True
        )
        
        if result:
            result['_id'] = str(result['_id'])
            return jsonify(result), 200
        return jsonify({'error': 'Alert not found'}), 404
        
    except Exception as e:
        print(f"Error resolving alert: {e}")
        return jsonify({'error': 'Failed to resolve alert'}), 500

# Legacy summary endpoint
@bp.route('/reports/summary', methods=['GET'])
@jwt_required()
def get_summary():
    try:
        helmet_attempts = db.alerts.count_documents({'type': 'helmetAttempt'})
        alcohol_attempts = db.alerts.count_documents({'type': 'alcoholAttempt'})
        successful_rides = db.rides.count_documents({'helmetWorn': True, 'alcoholDetected': False})
        
        return jsonify({
            'helmetAttempts': helmet_attempts,
            'alcoholAttempts': alcohol_attempts,
            'successfulRides': successful_rides
        }), 200
    except Exception as e:
        print(f"Error fetching summary: {e}")
        return jsonify({'error': 'server'}), 500

# Hardware Status Endpoint (ESP8266/ESP32)
@bp.route('/hardware/status', methods=['POST'])
def hardware_status():
    """
    Receive status updates from ESP8266/ESP32
    Expected JSON format:
    {
        "bikeId": "BIKE123",
        "helmetWorn": true/false,
        "alcoholDetected": true/false,
        "battery": 85,
        "ignitionStatus": "on/off/blocked"
    }
    """
    try:
        data = request.get_json()
        bike_id = data.get('bikeId')
        
        if not bike_id:
            return jsonify({'error': 'bikeId is required'}), 400
        
        # Update bike status in database
        status_update = {
            'helmetWorn': data.get('helmetWorn', False),
            'alcoholDetected': data.get('alcoholDetected', False),
            'battery': data.get('battery', 0),
            'ignitionStatus': data.get('ignitionStatus', 'off'),
            'lastSeen': datetime.utcnow(),
            'isActive': True
        }
        
        db.bikes.update_one(
            {'bikeId': bike_id},
            {'$set': {'lastStatus': status_update, 'lastSeen': datetime.utcnow()}},
            upsert=True
        )
        
        # Emit real-time update via Socket.IO
        from app import socketio
        socketio.emit('status', {
            'bikeId': bike_id,
            **status_update
        }, room=f'bike_{bike_id}')
        
        # Check for violations and create alerts
        if data.get('alcoholDetected'):
            alert = {
                'bikeId': bike_id,
                'type': 'alcoholAttempt',
                'severity': 'high',
                'message': 'Alcohol detected! Ignition blocked.',
                'timestamp': datetime.utcnow(),
                'resolved': False
            }
            db.alerts.insert_one(alert)
            socketio.emit('alert', alert, room=f'bike_{bike_id}')
            
        if not data.get('helmetWorn') and data.get('ignitionStatus') == 'attempted':
            alert = {
                'bikeId': bike_id,
                'type': 'helmetAttempt',
                'severity': 'medium',
                'message': 'Helmet not worn! Ignition blocked.',
                'timestamp': datetime.utcnow(),
                'resolved': False
            }
            db.alerts.insert_one(alert)
            socketio.emit('alert', alert, room=f'bike_{bike_id}')
        
        # Determine ignition control response
        ignition_allowed = data.get('helmetWorn', False) and not data.get('alcoholDetected', False)
        
        return jsonify({
            'success': True,
            'ignitionAllowed': ignition_allowed,
            'message': 'Status updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error processing hardware status: {e}")
        return jsonify({'error': 'Failed to process status'}), 500
