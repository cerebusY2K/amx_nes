const cleanObject = (obj) => {
    const cleanObj = {};
    Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
            cleanObj[key] = obj[key];
        }
    });
    return cleanObj;
};

export default cleanObject;
