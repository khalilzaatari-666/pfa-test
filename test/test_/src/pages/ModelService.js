export class ModelService {

    async getModels() {
        try {
            const response = await fetch('http://127.0.0.1:5000/models', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch models.');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }
}
