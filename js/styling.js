$(document).ready(()=>{
        // let isFollowing = false;
    let thisUser = $('.userHandle').text();
    thisUser = thisUser.replace('@', '');
    $.ajax({
        url: '/isFriend?checkUser='+thisUser,
        method: 'GET',
        success: function(data){
            executeAfterData(data.isFriend);
        }        
    })
    function appendUser(user){
        var mainDiv = $('<div></div>').addClass('searchResult');
        var innerSpan = $('<span></span>').addClass('userText');
        var innerLink = $('<a></a>').attr('href', '/user/' + user).text("@" + user);
        innerSpan.append(innerLink);
        mainDiv.append(innerSpan);
        $('.searchResultsContainer').append(mainDiv);
    }
    function noUser(){
        var mainDiv = $('<div></div>').addClass('searchResult');
        var innerSpan = $('<span></span>').addClass('userText').text("No user found.");
        // innerSpan.append(innerLink);
        mainDiv.append(innerSpan);
        $('.searchResultsContainer').append(mainDiv);
    }
    function executeAfterData(isFollowing){ 
        
        let w = $('.userName').width();
        if(isFollowing){
            $('.addFriend').text("Following");
        }
        else{
            $('.addFriend').text("Follow");
        }
        $('.addFriend').css('left', w.toString()+`px`);
        $('.alreadyFriends').css('left', w.toString()+`px`);
        $('.textAdd').on('click', (e)=>{
            e.preventDefault();
            $('.postInputContainer').css('display', 'block');
            $('nav').toggleClass('blur');
            $('.bigContainer').toggleClass('blur');
        })
        $('.exitSignContainer').on('click', (e)=>{
            e.preventDefault();
            $('.postInputContainer').css('display', 'none');
            $('nav').toggleClass('blur');
            $('.bigContainer').toggleClass('blur');
        })
        $('.submitPost').on('click', (e)=>{
            e.preventDefault();
            let postBody = $('#postBodyTextarea').val();
            $.ajax({
                url: '/addPost',
                method: 'POST',           
                dataType: 'json',
                data: {newPost: postBody},
                success: function(response){
                    if(response.success){
                        location.reload();
                    }
                }
            })
        })
        $('.nameContainer').on('click', (e)=>{
            e.preventDefault();
            $('.settingsContainer').toggleClass('displaySettings');
            $('.arrowUp').toggleClass('displaySettings');
        })
        $('.addFriend').on('click', (e)=>{
            e.preventDefault();
            // appendUser('testUser');
            console.log(thisUser);
            if(!isFollowing){
                $.ajax({
                    url: '/addFriend',
                    method: 'POST',
                    dataType: 'json',
                    data: {followRequestedFor: thisUser},
                    success: function(data){
                        if(data.success){
                            $('.addFriend').text("Following");
                            isFollowing = true;
                        }
                    }
                })
            }
            else{
                $.ajax({
                    url: '/removeFriend',
                    method: 'POST',
                    dataType: 'json',
                    data: {removeFollowFor: thisUser},
                    success: function(data){
                        if(data.success){
                            $('.addFriend').text("Follow");
                            isFollowing = false;
                        }
                    }
                })
            }
        })
        $('#searchTermBar').on('focusout', (e)=>{
            e.preventDefault();
            if($('.userText:hover').length == 0){
                $('.searchResultsContainer').toggleClass('displaySettings');
            }
        })
        $('#searchTermBar').on('focus', (e)=>{
            e.preventDefault();
            $('.searchResultsContainer').toggleClass('displaySettings');
        })

        $('#searchTermBar').bind('keyup', (e)=>{
            e.preventDefault();
            let sTerm = $('#searchTermBar').val();
            if (sTerm == ''){
                $('.searchResultsContainer').html(' ');
                return;
            }
            $.ajax({
                url: '/searchUser',
                method: 'POST',
                dataType: 'json',
                data: {searchTerm: sTerm},
                success: (response)=>{
                    console.log(response);
                    if(response.length == 0){
                        $('.searchResultsContainer').html(' ');
                        noUser();
                    }
                    else{
                        $('.searchResultsContainer').html(' ');
                        response.forEach(element => {
                            appendUser(element.user);
                        });
                    }
                }
            });
        });
        $('.likeIconContainer').on('click', (e)=>{
            e.preventDefault();
            console.log($($(e.target).parents())[1]);
        })
    }
})