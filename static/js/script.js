document.addEventListener('DOMContentLoaded', function() {
    $('#word-select').on('change', function() {
        var selectedWord = $(this).val();
        var gridCount = selectedWord.length;

        // Clear the previous grid items
        $('#grid-container').empty();

        for (var i = 0; i < gridCount; i++) {
            $('#grid-container').append(
                '<div class="grid-item">' +
                    '<canvas class="grid-canvas" width="98" height="98"></canvas>' +
                    '<div class="prediction-status" style="font-size: 24px;"></div>' +
                '</div>'
            );
        }

        // Initialize canvases for drawing
        const canvases = document.querySelectorAll('.grid-canvas');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            let drawing = false;

            canvas.addEventListener('mousedown', startPosition);
            canvas.addEventListener('mouseup', endPosition);
            canvas.addEventListener('mousemove', draw);

            function startPosition(e) {
                drawing = true;
                draw(e);
            }

            function endPosition() {
                drawing = false;
                ctx.beginPath();
            }

            function draw(e) {
                if (!drawing) return;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#000';

                let rect = canvas.getBoundingClientRect();
                let x = (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
                let y = (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;

                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
        });
    });

    document.getElementById('validate-button').addEventListener('click', function() {
        var imageDataArray = [];

        document.querySelectorAll('.grid-canvas').forEach(function(canvas) {
            var imageData = canvas.toDataURL('image/jpg');
            imageDataArray.push(imageData);
        });        

        // Send the imageDataArray to the Flask backend for validation and prediction
        fetch('/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image_data_array: imageDataArray })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Handle the response from the Flask backend
            var results = data.results;
            document.querySelectorAll('.grid-item').forEach(function(item, index) {
                var predictedChar = results[index].predicted_class_name.toLowerCase();;
                var actualChar = $('#word-select').val()[index].toLowerCase();
                var predictionStatus = item.querySelector('.prediction-status');

                if (predictedChar === actualChar) {
                    predictionStatus.innerHTML = '<span style="color: green !important;">&#10004;</span>'; // Correct prediction
                } else {
                    predictionStatus.innerHTML = '<span style="color: red !important;">&#10006;</span>'; // Incorrect prediction
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            // Handle errors
        });
    });

    function clearGrid() {
        const gridItems = document.querySelectorAll('.grid-item');
        gridItems.forEach(item => {
            // Clear the canvas
            const canvas = item.querySelector('.grid-canvas');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
    
            // Clear the prediction status
            const predictionStatus = item.querySelector('.prediction-status');
            predictionStatus.innerHTML = '';
        });
    }

    // Add an event listener to the clear button
    document.getElementById('clear-button').addEventListener('click', clearGrid);

});
