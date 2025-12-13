/**
 * Upload Handler
 * Handles image resizing, preview, and AJAX upload with progress
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('game-form');
    const thumbnailInput = document.getElementById('thumbnail');
    const thumbnailPreview = document.getElementById('thumbnail-preview'); // Need to add this ID to img
    const progressBarContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // Configuration
    const MAX_WIDTH = 800; // Max width for resized image
    const JPEG_QUALITY = 0.8;

    // Store resized blob
    let resizedThumbnailBlob = null;

    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', function(e) {
            handleImagePreview(e.target, thumbnailPreview, MAX_WIDTH, JPEG_QUALITY, function(blob) {
                resizedThumbnailBlob = blob;
            });
        });
    }

    // [NEW] Icon Preview Handler
    const iconInput = document.getElementById('icon');
    const iconPreview = document.getElementById('icon-preview');
    let resizedIconBlob = null; // We might want to resize icons too

    if (iconInput) {
        iconInput.addEventListener('change', function(e) {
            handleImagePreview(e.target, iconPreview, 300, JPEG_QUALITY, function(blob) { // Smaller max width for icon
                 resizedIconBlob = blob;
            });
        });
    }

    // Helper function to avoid code duplication
    function handleImagePreview(input, previewElement, maxWidth, quality, callback) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = function() {
                const canvas = document.createElement('canvas');
                let width = image.width;
                let height = image.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                if (previewElement) {
                    previewElement.src = dataUrl;
                    previewElement.style.display = 'block';
                }

                canvas.toBlob(function(blob) {
                    if(callback) callback(blob);
                    console.log(`Image resized: ${Math.round(blob.size/1024)}KB`);
                }, 'image/jpeg', quality);
            };
        };
        reader.readAsDataURL(file);
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            // Only hijack submit if we have a file to upload or want to show progress
            // For simplicity, we'll always hijack to show progress for any upload
            
            // If it's a GET request (search), don't hijack
            if (form.method.toUpperCase() === 'GET') return;

            e.preventDefault();

            const formData = new FormData(form);
            
            // Replace thumbnail with resized version if available
            if (resizedThumbnailBlob) {
                formData.set('thumbnail', resizedThumbnailBlob, 'thumbnail.jpg');
            }
            
            // [NEW] Append resized icon
            if (typeof resizedIconBlob !== 'undefined' && resizedIconBlob) {
                formData.set('icon', resizedIconBlob, 'icon.jpg');
            }

            const xhr = new XMLHttpRequest();
            xhr.open(form.method, form.action, true);

            // Progress handler
            xhr.upload.onprogress = function(e) {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    if (progressBar) {
                        progressBar.style.width = percentComplete + '%';
                        progressBar.setAttribute('aria-valuenow', percentComplete);
                    }
                    if (progressText) {
                        if (percentComplete === 100) {
                            progressText.textContent = 'Processing...';
                        } else {
                            progressText.textContent = percentComplete + '%';
                        }
                    }
                    if (progressBarContainer) {
                        progressBarContainer.style.display = 'block';
                    }
                }
            };

            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Success - usually a redirect
                    // Since we can't easily follow redirects with XHR outcome in the same way as browser,
                    // we check if the responseURL is different or if the response is HTML
                    window.location.href = xhr.responseURL || '/games';
                } else {
                    // Error
                    alert('Upload failed. Please try again.');
                    console.error('Upload error:', xhr.statusText);
                }
            };

            xhr.onerror = function() {
                alert('Upload failed. Network error.');
            };

            xhr.send(formData);
        });
    }
});
