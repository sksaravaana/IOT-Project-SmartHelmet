from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
from bson import ObjectId
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db, mqtt_client

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    return None

@bp.route('/bike/<bike_id>/ignition', methods=['POST'])
@jwt_required()
def set_ignition(bike_id):
    # Check admin role
    error = admin_required()
    if error:
        return error
    
    try:
        data = request.get_json()
        block = data.get('block', False)
        
        # Update bike in database
        result = db.bikes.find_one_and_update(
            {'bikeId': bike_id},
            {'$set': {
                'ignitionBlocked': block,
                'lastControlUpdate': datetime.utcnow()
            }},
            return_document=True
        )
        
        if not result:
            return jsonify({'error': 'Bike not found'}), 404
        
        # Send MQTT command
        command = 'BLOCK' if block else 'ALLOW'
        topic = f'smarthelmet/{bike_id}/control'
        mqtt_client.publish(topic, command)
        
        return jsonify({
            'ok': True,
            'bikeId': bike_id,
            'ignitionBlocked': block,
            'message': f'Ignition {"blocked" if block else "allowed"}'
        }), 200
        
    except Exception as e:
        print(f"Error setting ignition: {e}")
        return jsonify({'error': 'Failed to control ignition'}), 500

@bp.route('/pair', methods=['POST'])
@jwt_required()
def pair_helmet():
    # Check admin role
    error = admin_required()
    if error:
        return error
    
    try:
        data = request.get_json()
        bike_id = data.get('bikeId')
        helmet_id = data.get('helmetId')
        
        if not bike_id or not helmet_id:
            return jsonify({'error': 'bikeId and helmetId are required'}), 400
        
        # Update bike with helmet pairing
        result = db.bikes.find_one_and_update(
            {'bikeId': bike_id},
            {'$set': {
                'helmetId': helmet_id,
                'pairedAt': datetime.utcnow()
            }},
            return_document=True
        )
        
        if not result:
            return jsonify({'error': 'Bike not found'}), 404
        
        # Send MQTT pairing command
        topic = f'smarthelmet/{bike_id}/pair'
        mqtt_client.publish(topic, helmet_id)
        
        return jsonify({
            'ok': True,
            'bikeId': bike_id,
            'helmetId': helmet_id,
            'message': 'Helmet paired successfully'
        }), 200
        
    except Exception as e:
        print(f"Error pairing helmet: {e}")
        return jsonify({'error': 'Failed to pair helmet'}), 500
