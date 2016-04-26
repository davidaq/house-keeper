
function ajax(path, params = {}) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            method:'post',
            url: path,
            contentType: 'application/json',
            data: JSON.stringify(params),
            dataType: 'json',
            success: function(result) {
                if (result && result.error) {
                    reject(result.error);
                } else {
                    resolve(result);
                }
            },
            error: function(xhr, txtStatus, err) {
                reject({error:err, status:txtStatus});
            }
        });
    });
}