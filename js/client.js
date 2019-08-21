// import { brotliDecompressSync } from "zlib";

$(document).ready(()=>{
    var usrNameChk = false;    
    $('.user').bind('keyup', (e)=>{
        e.preventDefault();
        let usr = $('.user').val();
        $.ajax({
            url: '/checkUser',
            method: 'POST',
            dataType: 'json',
            data: {username:usr},
            success: (response)=>{
                if(response.exists){
                    $('.user').removeClass('nope');
                    $('.user').addClass('exists');
                    usrNameChk = false;
                    $('input[name=submit]').attr('disabled', true)
                }
                else{
                    $('.user').addClass('nope');
                    $('.user').removeClass('exists')
                    usrNameChk = true;
                    $('input[name=submit]').attr('disabled', false)
                }
            }
        })
    })
});