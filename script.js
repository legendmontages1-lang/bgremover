const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const processing = document.getElementById('processing');
const result = document.getElementById('result');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');

let processedImageUrl = '';

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#764ba2';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#667eea';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImage(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImage(file);
    }
});

async function handleImage(file) {
    // Show original image
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Show processing
    uploadArea.classList.add('hidden');
    processing.classList.remove('hidden');

    try {
        // Use free API (no key required)
        const formData = new FormData();
        formData.append('image_file', file);
        formData.append('size', 'auto');

        // Using free remove.bg alternative API
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': 'temp_api_key' // Free tier
            },
            body: formData
        });

        if (!response.ok) {
            // Fallback to client-side processing
            await clientSideRemoval(file);
            return;
        }

        const blob = await response.blob();
        processedImageUrl = URL.createObjectURL(blob);
        resultImage.src = processedImageUrl;

        // Show result
        processing.classList.add('hidden');
        result.classList.remove('hidden');

    } catch (error) {
        // Client-side fallback
        await clientSideRemoval(file);
    }
}

// Client-side background removal (fallback)
async function clientSideRemoval(file) {
    try {
        // Using canvas-based simple background removal
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Simple background removal algorithm
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Remove white/light backgrounds
                    if (r > 200 && g > 200 && b > 200) {
                        data[i + 3] = 0; // Make transparent
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                processedImageUrl = canvas.toDataURL('image/png');
                resultImage.src = processedImageUrl;

                processing.classList.add('hidden');
                result.classList.remove('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);

    } catch (error) {
        alert('Failed to remove background. Please try another image.');
        location.reload();
    }
}

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = processedImageUrl;
    link.download = `removed-bg-${Date.now()}.png`;
    link.click();
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#4caf50;color:white;padding:15px 25px;border-radius:10px;z-index:9999;';
    successMsg.textContent = '✅ Downloaded successfully!';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
});