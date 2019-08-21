$(document).ready(()=>{
    $('#searchTermBar').bind('keyup', (e)=>{
        e.preventDefault();
        let sTerm = $('#searchTermBar').val();
        if (sTerm == '') return;
        $.ajax({
            url: '/searchUser',
            method: 'POST',
            dataType: 'json',
            data: {searchTerm: sTerm},
            success: (response)=>{
                console.log(response);
            }
        });
    });
});