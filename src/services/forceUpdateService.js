const { adminFirestore, getAsync, setAsync } = require('../firebase');

const CACHE_EXPIRY_TIME = 60 * 60; // 1 hour in seconds

const getForceUpdateData = async () => {
  try {
    // Try to get data from cache
    const cachedData = await getAsync('forceUpdateData');

    if (cachedData) {
      // Data is available in cache, return it
      return JSON.parse(cachedData);
    } else {
      // Data is not available in cache, fetch from Firebase
      const doc = await adminFirestore.collection('apps').doc('yourAppId').get();
      if (!doc.exists) {
        throw new Error('No such document!');
      }
      const data = doc.data();

      // Store the fetched data in cache
      await setAsync('forceUpdateData', JSON.stringify(data), 'EX', CACHE_EXPIRY_TIME);

      // Return the fetched data
      return data;
    }
  } catch (error) {
    console.error('Error fetching force update data:', error);
    throw new Error('Internal Server Error');
  }
};

module.exports = {
  getForceUpdateData
};
