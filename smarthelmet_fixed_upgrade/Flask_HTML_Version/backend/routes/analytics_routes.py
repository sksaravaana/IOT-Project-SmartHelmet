from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from bson import ObjectId
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db

bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        bike_id = request.args.get('bikeId')
        
        query = {}
        if bike_id:
            query['bikeId'] = bike_id
        
        # Get ride statistics
        total_rides = db.rides.count_documents(query)
        successful_rides = db.rides.count_documents({**query, 'helmetWorn': True, 'alcoholDetected': False})
        
        # Get attempt statistics
        helmet_attempts = db.alerts.count_documents({**query, 'type': 'helmetAttempt'})
        alcohol_attempts = db.alerts.count_documents({**query, 'type': 'alcoholAttempt'})
        
        summary = {
            'totalRides': total_rides,
            'successfulRides': successful_rides,
            'helmetAttempts': helmet_attempts,
            'alcoholAttempts': alcohol_attempts,
            'helmetViolations': helmet_attempts,
            'alcoholDetections': alcohol_attempts
        }
        
        return jsonify({'summary': summary}), 200
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500

@bp.route('/timeseries', methods=['GET'])
@jwt_required()
def get_timeseries_data():
    try:
        bike_id = request.args.get('bikeId')
        days = int(request.args.get('days', 7))
        
        query = {}
        if bike_id:
            query['bikeId'] = bike_id
        
        # Get data for the last N days
        start_date = datetime.utcnow() - timedelta(days=days)
        query['timestamp'] = {'$gte': start_date}
        
        rides = list(db.rides.find(query).sort('timestamp', 1))
        
        # Format data for charts
        timeseries = []
        for ride in rides:
            timeseries.append({
                'date': ride['timestamp'].isoformat(),
                'helmetWorn': ride.get('helmetWorn', False),
                'alcoholDetected': ride.get('alcoholDetected', False)
            })
        
        return jsonify({'timeseries': timeseries}), 200
        
    except Exception as e:
        print(f"Error fetching timeseries data: {e}")
        return jsonify({'error': 'Failed to fetch timeseries data'}), 500

@bp.route('/report', methods=['GET'])
@jwt_required()
def get_detailed_report():
    try:
        bike_id = request.args.get('bikeId')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        query = {}
        if bike_id:
            query['bikeId'] = bike_id
        
        if start_date and end_date:
            query['timestamp'] = {
                '$gte': datetime.fromisoformat(start_date),
                '$lte': datetime.fromisoformat(end_date)
            }
        
        rides = list(db.rides.find(query).sort('timestamp', -1))
        alerts = list(db.alerts.find(query).sort('timestamp', -1))
        
        for ride in rides:
            ride['_id'] = str(ride['_id'])
        for alert in alerts:
            alert['_id'] = str(alert['_id'])
        
        return jsonify({
            'rides': rides,
            'alerts': alerts
        }), 200
        
    except Exception as e:
        print(f"Error fetching detailed report: {e}")
        return jsonify({'error': 'Failed to fetch detailed report'}), 500

@bp.route('/fleet', methods=['GET'])
@jwt_required()
def get_fleet_overview():
    try:
        # Get all bikes
        bikes = list(db.bikes.find({}))
        
        total_bikes = len(bikes)
        active_bikes = sum(1 for bike in bikes if bike.get('isActive', False))
        
        # Calculate stats for each bike
        for bike in bikes:
            bike['_id'] = str(bike['_id'])
            bike_id = bike['bikeId']
            
            # Get ride stats
            total_rides = db.rides.count_documents({'bikeId': bike_id})
            successful_rides = db.rides.count_documents({
                'bikeId': bike_id,
                'helmetWorn': True,
                'alcoholDetected': False
            })
            
            # Get alert stats
            active_alerts = db.alerts.count_documents({
                'bikeId': bike_id,
                'resolved': False
            })
            
            success_rate = (successful_rides / total_rides * 100) if total_rides > 0 else 0
            
            bike['stats'] = {
                'totalRides': total_rides,
                'successfulRides': successful_rides,
                'successRate': round(success_rate, 1),
                'activeAlerts': active_alerts
            }
            
            # Populate owner info
            if 'ownerId' in bike and bike['ownerId']:
                owner = db.users.find_one({'_id': ObjectId(bike['ownerId'])}, {'username': 1})
                if owner:
                    bike['ownerId'] = {'username': owner.get('username')}
        
        return jsonify({
            'totalBikes': total_bikes,
            'activeBikes': active_bikes,
            'bikes': bikes
        }), 200
        
    except Exception as e:
        print(f"Error fetching fleet overview: {e}")
        return jsonify({'error': 'Failed to fetch fleet overview'}), 500

@bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_stats(user_id):
    try:
        # Get user's bikes
        bikes = list(db.bikes.find({'ownerId': ObjectId(user_id)}))
        bike_ids = [bike['bikeId'] for bike in bikes]
        
        # Get stats for user's bikes
        total_rides = db.rides.count_documents({'bikeId': {'$in': bike_ids}})
        successful_rides = db.rides.count_documents({
            'bikeId': {'$in': bike_ids},
            'helmetWorn': True,
            'alcoholDetected': False
        })
        
        helmet_violations = db.alerts.count_documents({
            'bikeId': {'$in': bike_ids},
            'type': 'helmetAttempt'
        })
        
        alcohol_detections = db.alerts.count_documents({
            'bikeId': {'$in': bike_ids},
            'type': 'alcoholAttempt'
        })
        
        return jsonify({
            'totalRides': total_rides,
            'successfulRides': successful_rides,
            'helmetViolations': helmet_violations,
            'alcoholDetections': alcohol_detections,
            'bikes': len(bikes)
        }), 200
        
    except Exception as e:
        print(f"Error fetching user stats: {e}")
        return jsonify({'error': 'Failed to fetch user stats'}), 500
