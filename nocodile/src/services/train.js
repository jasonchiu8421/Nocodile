const URL = 'http://localhost:8888';

/**
 * Train the model.
 * @param {Object} images - Dictionary of image name to URL encoded images
 * @param {string} code - String containing code for training
 * @returns {Promise} - Promise resolving to the training response
 */
export async function train(images, code) {
    try {
      const response = await fetch(`${URL}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset: images,
          code: code,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Training failed with status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error during training:', error);
      throw error;
    }
  }