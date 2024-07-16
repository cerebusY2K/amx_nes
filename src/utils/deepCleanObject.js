const deepCleanObject = (obj) => {
    const cleanObj = {};
    Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
                cleanObj[key] = deepCleanObject(obj[key]);
            } else {
                cleanObj[key] = obj[key];
            }
        }
    });
    return cleanObj;
};

export default deepCleanObject;
