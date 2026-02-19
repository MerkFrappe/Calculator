from flask import Flask, request, jsonify, send_from_directory
from median import compute_stats
import os

app = Flask(__name__, static_folder='frontend', static_url_path='')


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def static_proxy(path):
    # Serve static files (js, css, assets)
    return send_from_directory(app.static_folder, path)


@app.route('/api/compute', methods=['POST'])
def api_compute():
    data = request.get_json(silent=True)
    if not data or 'dataset' not in data:
        return jsonify({'error': 'Missing dataset in request'}), 400

    dataset = data['dataset']
    # Expect dataset as list of {l,u,f} or {lower,upper,frequency}
    normalized = []
    for row in dataset:
        try:
            if 'l' in row and 'u' in row and 'f' in row:
                normalized.append({'l': float(row['l']), 'u': float(row['u']), 'f': float(row['f'])})
            elif 'lower' in row and 'upper' in row and 'frequency' in row:
                normalized.append({'l': float(row['lower']), 'u': float(row['upper']), 'f': float(row['frequency'])})
            else:
                return jsonify({'error': 'Invalid row format'}), 400
        except Exception:
            return jsonify({'error': 'Invalid numeric values in dataset'}), 400

    try:
        result = compute_stats(normalized)
        # Convert keys in dataset to simple names for JSON
        out = result.copy()
        out['dataset'] = [{'l': r['l'], 'u': r['u'], 'f': r['f'], 'x': r.get('x')} for r in result['dataset']]
        return jsonify(out)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
