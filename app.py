from flask import Flask, render_template, request, jsonify
from PIL import Image
import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.models import load_model
import numpy as np
import io
import base64
import utility

app = Flask(__name__)

IMAGE_SIZE = (50, 50)
# Load the trained model
model = load_model(r'static\model\char_recognition_model_v3.h5')

# Route to the index.html page
@app.route('/')
def index():
    word_options = utility.VOCAB_LIST
    return render_template('index.html', word_options=word_options)


@app.route('/validate', methods=['POST'])
def validate_images():
    data = request.get_json()
    image_data_array = data['image_data_array']

    # Load and preprocess the images
    images = []
    for index, image_data in enumerate(image_data_array):
        # Decode the base64 encoded image data
        image_data = image_data.split(',')[1]
        image_binary = base64.b64decode(image_data)

        image_stream = io.BytesIO(image_binary)
        image_path = os.path.join(r'static\images', f'image_{index}.jpg')
        # Open and convert the image
        img = Image.open(image_stream)
        new_img = Image.new("RGB", img.size, (255, 255, 255))
        new_img.paste(img, mask=img.split()[3])
        new_img.save(image_path, 'JPEG')

    image_directory = r'static\images'
    image_files = [f for f in os.listdir(image_directory) if os.path.isfile(os.path.join(image_directory, f))]
    # Load and preprocess the images
    images = []
    for image_file in image_files:
        image_path = os.path.join(image_directory, image_file)
        img = load_img(image_path, color_mode='grayscale', target_size=IMAGE_SIZE)
        img_array = img_to_array(img)
        img_array /= 255.0
        images.append(img_array)

    # Convert the list of images to a numpy array
    images = np.array(images)

    # Perform prediction for the batch of images
    predictions = model.predict(images)
    # Get the predicted class indices for each image
    predicted_class_indices = np.argmax(predictions, axis=1)

    # Map the class indices to class names using the class_mapping dictionary
    predicted_class_names = [utility.class_mapping[index] for index in predicted_class_indices]

    # Get the highest confidence score for each image
    max_confidence_scores = np.max(predictions, axis=1)

    # Prepare the results
    results = []
    for i, max_confidence_score in enumerate(max_confidence_scores):
        results.append({
            'predicted_class_name': predicted_class_names[i],
            'max_confidence_score': float(max_confidence_score)  # Convert to regular Python float
        })

    # Delete the images after processing
    for image_file in image_files:
        os.remove(os.path.join(image_directory, image_file))

    # Respond with the results
    response = {'results': results}
    return jsonify(response)


if __name__ == '__main__':
    app.run(debug=True)
