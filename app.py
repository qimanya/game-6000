from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import random
import logging
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')

# 修改 SocketIO 配置
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=True,
    engineio_logger=True
)

# Game state
game_state = {
    'pressure': 0,
    'max_pressure': 10,
    'active_crises': [],
    'current_player': 1,
    'players': [],
    'started': False
}

# Available roles
AVAILABLE_ROLES = ['Student', 'Teacher', 'Guard']

# Crisis cards
crisis_cards = [
    {
        "level": 1,
        "title": "Level 1 Crisis",
        "desc_for_teacher": "A student hasn't submitted their group assignment.",
        "desc_for_student": "They look smelly, I don't want to work with them.",
        "desc_for_guard": "Crisis in the top floor of the teaching building, a student hasn't returned to dorm. Pressure +1",
        "needs": {"support": 2, "policy": 1},
        "tags": ["Discrimination"]
    },
    {
        "level": 2,
        "title": "Digital Violence",
        "desc_for_teacher": "Malicious photos targeting minority groups appear on anonymous forums",
        "desc_for_student": "Your social media account has been maliciously reported and banned",
        "desc_for_guard": "Need to monitor network attack sources. Pressure +3",
        "needs": {"support": 2, "policy": 1},
        "tags": ["Discrimination"]
    },
    {
        "level": 2,
        "title": "Resource Competition",
        "desc_for_teacher": "Lab equipment allocation shows gender bias",
        "desc_for_student": "Your equipment requests are always deprioritized",
        "desc_for_guard": "Equipment disputes in the lab building. Pressure +2",
        "needs": {"policy": 2},
        "tags": ["Gender"]
    },
    {
        "level": 1,
        "title": "Level 1 Crisis",
        "desc_for_teacher": "Their name is Anna, with a crew cut hairstyle",
        "desc_for_student": "You're not welcome in the men's changing room, go where you belong",
        "desc_for_guard": "Crisis in the gym, need to monitor for violent behavior. Pressure +2",
        "needs": {"support": 2, "policy": 1},
        "tags": ["LGBT"]
    },
    {
        "level": 2,
        "title": "Level 2 Crisis",
        "desc_for_teacher": "I remember this paper was written by John, why isn't his name on it",
        "desc_for_student": "When will I be able to publish my paper",
        "desc_for_guard": "Crisis in the library, need to maintain order. Pressure +1",
        "needs": {"support": 3},
        "tags": ["Academic"]
    },
    {
        "level": 2,
        "title": "Level 2 Crisis",
        "desc_for_teacher": "Received a strange email with many incomprehensible abbreviations and emojis",
        "desc_for_student": "I don't know how to write proper formal language",
        "desc_for_guard": "Crisis outside campus. Pressure +1",
        "needs": {"support": 2},
        "tags": ["Cultural"]
    }
]

# Action cards
action_cards = [
    {
        "type": "teacher",
        "title": "Gender-Neutral Facility Reform",
        "effect": "Promote campus facility reform",
        "effect_type": "policy",
        "tags": ["LGBT", "Gender"]
    },
    {
        "type": "teacher",
        "title": "Anti-Discrimination Online Course",
        "effect": "Conduct anti-discrimination education",
        "effect_type": "policy",
        "tags": ["Discrimination"]
    },
    {
        "type": "special",
        "title": "Emergency Hearing",
        "effect": "Convene emergency meeting",
        "effect_type": "support",
        "tags": ["General"]
    },
    {
        "type": "student",
        "title": "Peer Support",
        "effect": "Provide peer support",
        "effect_type": "support",
        "tags": ["General"]
    },
    {
        "type": "teacher",
        "title": "Academic Review",
        "effect": "Conduct academic review",
        "effect_type": "policy",
        "tags": ["Academic"]
    },
    {
        "type": "teacher",
        "title": "Anti-Discrimination Policy",
        "effect": "Promote anti-discrimination policy",
        "effect_type": "policy",
        "tags": ["Discrimination"]
    },
    {
        "type": "teacher",
        "title": "Cultural Awareness Course",
        "effect": "Conduct cultural awareness training",
        "effect_type": "policy",
        "tags": ["Cultural"]
    },
    {
        "type": "guard",
        "title": "On-site Security",
        "effect": "Enhance on-site security",
        "effect_type": "support",
        "tags": ["General"]
    },
    {
        "type": "student",
        "title": "Student Mutual Aid",
        "effect": "Organize student mutual aid",
        "effect_type": "support",
        "tags": ["General"]
    },
    {
        "type": "student",
        "title": "Cultural Exchange Group",
        "effect": "Promote cultural exchange",
        "effect_type": "support",
        "tags": ["Cultural"]
    },
    {
        "type": "teacher",
        "title": "Teacher Coordination",
        "effect": "Conduct teacher coordination",
        "effect_type": "policy",
        "tags": ["General"]
    },
    {
        "type": "teacher",
        "title": "Gender Equity Curriculum",
        "effect": "Promote gender equality in academic programs",
        "effect_type": "policy",
        "tags": ["Gender"]
    },
    {
        "type": "teacher",
        "title": "Cultural Sensitivity Training",
        "effect": "Enhance cross-cultural understanding",
        "effect_type": "policy",
        "tags": ["Cultural"]
    },
    {
        "type": "teacher",
        "title": "Anonymous Review System",
        "effect": "Ensure fair evaluation processes",
        "effect_type": "policy",
        "tags": ["Academic"]
    },
    {
        "type": "student",
        "title": "Inclusive Dialogue Space",
        "effect": "Foster open conversations about diversity",
        "effect_type": "support",
        "tags": ["LGBT"]
    },
    {
        "type": "student",
        "title": "Stress Relief Initiative",
        "effect": "Support peers facing academic pressure",
        "effect_type": "support",
        "tags": ["Academic"]
    },
    {
        "type": "student",
        "title": "Cultural Exchange Program",
        "effect": "Bridge gaps between different communities",
        "effect_type": "support",
        "tags": ["Cultural"]
    },
    {
        "type": "guard",
        "title": "Security Patrol",
        "effect": "Reduce pressure and prevent crisis escalation",
        "effect_type": "support",
        "tags": ["General"]
    },
    {
        "type": "guard",
        "title": "Conflict Mediation",
        "effect": "Resolve support needs and reduce pressure for discrimination cases",
        "effect_type": "support",
        "tags": ["Discrimination"]
    },
    {
        "type": "guard",
        "title": "Surveillance Review",
        "effect": "Identify anonymous attackers and prevent pressure increase",
        "effect_type": "support",
        "tags": ["Digital"]
    },
    {
        "type": "guard",
        "title": "Emergency Evacuation",
        "effect": "Reset pressure but skip next policy phase",
        "effect_type": "support",
        "tags": ["Violence"]
    },
    {
        "type": "guard",
        "title": "Witness Protection",
        "effect": "Provide safe space and resolve support needs",
        "effect_type": "support",
        "tags": ["LGBT"]
    },
    {
        "type": "guard",
        "title": "Riot Drill",
        "effect": "Enhance all support card effects this turn",
        "effect_type": "support",
        "tags": ["General"]
    },
    {
        "type": "guard",
        "title": "Network Firewall",
        "effect": "Prevent pressure increase from digital violence",
        "effect_type": "support",
        "tags": ["Digital"]
    },
    {
        "type": "guard",
        "title": "Mental Health First Aid",
        "effect": "Resolve support needs and reduce pressure",
        "effect_type": "support",
        "tags": ["MentalHealth"]
    }
]

# Define card types for each role
ROLE_CARD_TYPES = {
    'Teacher': ['policy', 'teacher'],
    'Student': ['support', 'student'],
    'Guard': ['support', 'guard']
}

def get_player_view(player_id):
    state = {
        'pressure': game_state['pressure'],
        'max_pressure': game_state['max_pressure'],
        'active_crises': [],
        'current_player': game_state['current_player'],
        'players': [],
        'started': game_state['started']
    }
    current_player = None
    for p in game_state['players']:
        if p['id'] == player_id:
            current_player = p
            break
    for crisis in game_state['active_crises']:
        if current_player:
            role = current_player['role']
            descs = {
                'Teacher': crisis.get('desc_for_teacher', ''),
                'Student': crisis.get('desc_for_student', ''),
                'Guard': crisis.get('desc_for_guard', '')
            }
            crisis_view = {
                'level': crisis['level'],
                'title': crisis['title'],
                'desc_for_teacher': descs['Teacher'] if role == 'Teacher' else '****',
                'desc_for_student': descs['Student'] if role == 'Student' else '****',
                'desc_for_guard': descs['Guard'] if role == 'Guard' else '****',
                'needs': crisis['needs']
            }
            state['active_crises'].append(crisis_view)
    for p in game_state['players']:
        if p['id'] == player_id:
            state['players'].append({
                'id': p['id'],
                'role': p['role'],
                'hand': p['hand'],
                'color': p['color'],
                'has_played_this_turn': p.get('has_played_this_turn', False)
            })
        else:
            state['players'].append({
                'id': p['id'],
                'role': p['role'],
                'hand_count': len(p['hand']),
                'color': p['color'],
                'has_played_this_turn': p.get('has_played_this_turn', False)
            })
    return state

def deal_hand_for_role(role):
    types = ROLE_CARD_TYPES.get(role, [])
    pool = [c for c in action_cards if c['type'] in types]
    if len(pool) >= 3:
        return random.sample(pool, 3)
    else:
        return (pool * 3)[:3]

def refill_hand(player):
    role_types = ROLE_CARD_TYPES.get(player['role'], [])
    pool = [c for c in action_cards if c['type'] in role_types]
    crisis = game_state['active_crises'][0] if game_state['active_crises'] else None
    crisis_tags = crisis.get('tags', []) if crisis else []
    if len(player['hand']) < 3 and pool and crisis_tags:
        has_match = any(any(tag in crisis_tags for tag in card.get('tags', [])) for card in player['hand'])
        if not has_match:
            match_pool = [c for c in pool if any(tag in crisis_tags for tag in c.get('tags', []))]
            if match_pool:
                player['hand'].append(random.choice(match_pool))
    while len(player['hand']) < 3 and pool:
        player['hand'].append(random.choice(pool))

@app.route('/')
def index():
    try:
        logger.info("Accessing homepage")
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error rendering homepage: {str(e)}")
        return f"Server error: {str(e)}", 500

@socketio.on('connect')
def on_connect():
    try:
        logger.info(f"New player connected: {request.sid}")
        if len(game_state['players']) >= 3:
            logger.warning("Game is full, rejecting new connection")
            return False
        player_id = str(random.randint(1000, 9999))
        player_color = ['#4CAF50', '#2196F3', '#FF9800'][len(game_state['players'])]
        new_player = {
            'id': player_id,
            'hand': [],
            'color': player_color,
            'avatar': '',
            'role': '',
            'socket_id': request.sid,
            'has_played_this_turn': False
        }
        game_state['players'].append(new_player)
        logger.info(f"Player {player_id} joined the game, current players: {len(game_state['players'])}")
        emit('player_connected', {
            'player_id': player_id,
            'total_players': len(game_state['players'])
        })
        emit('game_state', get_player_view(player_id))
        emit('player_connected', {
            'total_players': len(game_state['players'])
        }, broadcast=True, include_self=False)
        if len(game_state['players']) == 3:
            auto_start_game()
        return True
    except Exception as e:
        logger.error(f"Error handling connection: {str(e)}")
        return False

@socketio.on('disconnect')
def on_disconnect():
    try:
        logger.info(f"Player disconnected: {request.sid}")
        for i, player in enumerate(game_state['players']):
            if player['socket_id'] == request.sid:
                logger.info(f"Removing player {player['id']}")
                game_state['players'].pop(i)
                break
        if not game_state['started']:
            emit('game_state', game_state, broadcast=True)
            emit('player_connected', {
                'total_players': len(game_state['players'])
            }, broadcast=True)
    except Exception as e:
        logger.error(f"Error handling disconnection: {str(e)}")

def auto_start_game():
    try:
        logger.info("Auto starting game")
        roles = AVAILABLE_ROLES.copy()
        random.shuffle(roles)
        for i, player in enumerate(game_state['players']):
            player['role'] = roles[i]
            player['avatar'] = f'avatar_{roles[i].lower()}.png'
            player['has_played_this_turn'] = False
        game_state['started'] = True
        game_state['active_crises'] = [random.choice(crisis_cards)]
        for player in game_state['players']:
            player['hand'] = deal_hand_for_role(player['role'])
        game_state['pressure'] = 0
        logger.info("Game started, roles assigned")
        for player in game_state['players']:
            emit('game_state', get_player_view(player['id']), room=player['socket_id'])
    except Exception as e:
        logger.error(f"Error auto starting game: {str(e)}")

@socketio.on('play_card')
def on_play_card(data):
    try:
        logger.info(f"Player using card: {data}")
        player_id = data['player_id']
        card_index = data['card_index']
        all_played = True
        for player in game_state['players']:
            if player['id'] == player_id:
                if player.get('has_played_this_turn', False):
                    logger.info(f"Player {player_id} has already played this turn, rejecting")
                    return
                if 0 <= card_index < len(player['hand']):
                    card = player['hand'][card_index]
                    allowed_types = ROLE_CARD_TYPES.get(player['role'], [])
                    if card['type'] not in allowed_types:
                        logger.info(f"Player {player_id} tried to play unauthorized card type {card['type']}")
                        return
                    crisis = game_state['active_crises'][0] if game_state['active_crises'] else None
                    tag_match = False
                    if crisis:
                        tag_match = (
                            any(tag in crisis.get('tags', []) for tag in card.get('tags', []))
                            or "General" in card.get('tags', [])
                        )
                    player['hand'].pop(card_index)
                    player['has_played_this_turn'] = True
                    if tag_match and crisis and card.get('effect_type'):
                        for need_type in crisis['needs']:
                            if card['effect_type'] == need_type and crisis['needs'][need_type] > 0:
                                crisis['needs'][need_type] = max(0, crisis['needs'][need_type] - 1)
                    if crisis and all(v == 0 for v in crisis['needs'].values()):
                        game_state['active_crises'].pop(0)
                        if crisis_cards:
                            game_state['active_crises'].append(random.choice(crisis_cards))
                        for p in game_state['players']:
                            p['has_played_this_turn'] = False
                            refill_hand(p)
                        break
        all_played = all(p.get('has_played_this_turn', False) for p in game_state['players'])
        crisis = game_state['active_crises'][0] if game_state['active_crises'] else None
        if all_played and crisis and not all(v == 0 for v in crisis['needs'].values()):
            game_state['pressure'] += 2
            for p in game_state['players']:
                p['has_played_this_turn'] = False
                refill_hand(p)
        if game_state['pressure'] >= game_state['max_pressure']:
            game_state['failed'] = True
        else:
            game_state['failed'] = False
        for player in game_state['players']:
            emit('game_state', get_player_view(player['id']), room=player['socket_id'])
    except Exception as e:
        logger.error(f"Error handling card play: {str(e)}")

@socketio.on_error()
def error_handler(e):
    logger.error(f"SocketIO error: {str(e)}")

if __name__ == '__main__':
    try:
        logger.info("Starting game server")
        port = int(os.environ.get('PORT', 5001))
        host = os.environ.get('HOST', '0.0.0.0')
        logger.info(f"Server starting on {host}:{port}")
        socketio.run(app, debug=True, host=host, port=port)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")

# Vercel 支持
app = socketio.wsgi_app(app) 