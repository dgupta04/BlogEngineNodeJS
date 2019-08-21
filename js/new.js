$(document).ready(()=>{
    $.ajax({
        method: 'GET',
        url: '/renderNew',
        success: function(data){
            console.log(data);
        }
    })
})