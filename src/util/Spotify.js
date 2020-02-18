const clientId = process.env.REACT_APP_CLIENT_KEY;
const redirectURI = 'http://localhost:3000/';
let userAccessToken;

const Spotify = {
    getAccessToken(){
        if(userAccessToken){
            return userAccessToken;
        };

        //Checks for access token
        const accessToken = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if(accessToken && expiresInMatch) {
            userAccessToken = accessToken[1];
            const expiresIn = Number(expiresInMatch[1]);

            //Clears the parameters from the URL, so the app doesn't attempt to grab expired access token
            window.setTimeout(() => userAccessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return userAccessToken;
        }else {
            const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;  
            window.location = url;
        }
    },

    search(term){
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }).then(response => response.json()
        ).then(jsonResponse => {
            if(!jsonResponse.tracks) {
                 return [];
                }
                return jsonResponse.tracks.items.map(track => ({
                    id: track.id,
                    name: track.name,
                    artist: track.artists[0].name,
                    album: track.album.name,
                    uri: track.uri
                }))
            })
    },

    savePlaylist(name, trackURIs) {
        if(!name || !trackURIs.length){
            return;
        }

        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}`};
        let userId;

        return fetch(`https://api.spotify.com/v1/me`, {
            headers: headers
        }).then(response => response.json()
        ).then(jsonResponse => {
            userId = jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                headers: headers,
                method: 'POST',
                body: JSON.stringify({ name: name })
            }).then(response => response.json()
            ).then(jsonResponse => {
                const playlistId = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({ uris: trackURIs })
                })
            })
        });
    }

    
};

export default Spotify;