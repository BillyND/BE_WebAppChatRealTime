// Function to paginate an array based on page and limit
function paginateArray(data, page, limit) {
  try {
    // Calculate the start and end indexes for pagination
    const startIndex = (page - 1) * limit;
    const endIndex = parseInt(startIndex) + parseInt(limit);

    // Return the sliced data based on the indexes
    return data.slice(startIndex, endIndex);
  } catch (error) {
    // If an error occurs, return the original data
    return data;
  }
}

module.exports = { paginateArray };
