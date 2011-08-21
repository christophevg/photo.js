(function(globals) {
  
  var

  get = function get(url, callback) {
    var e  = document.createElement("script");
    e.src  = url;
    e.type = "text/javascript";
    document.getElementsByTagName("head")[0].appendChild(e); 
  },
  
  // executed in scope of viewer
  processAlbums = function processAlbums( data ) {
    var albums = data.feed.entry;
    for( var a=0; a<albums.length; a++ ) {
      var album = albums[a];
      var id = album.link[0].href.replace( /\?.*$/, "" );
      this.addAlbum( {
        id     : id,
        title  : album.title.$t,
        thumb  : album['media$group']['media$thumbnail'][0].url,
      } );

      var cb = registerCallback( (function(viewer) { 
        return function(data) { processPhotos.call(viewer, data); } })(this));
      var base = album.link[0].href;
      var url = base + "&kind=photo&callback=__google_photo_cb__["+cb+"]";
      get( url );
    }
  },
    
  // executed in scope of viewer
  processPhotos = function processPhotos( data ) {
    var albumId  = data.feed.id.$t;
    var photos = data.feed.entry;
    for( var p=0; p<photos.length; p++ ) {
      var photo = photos[p];
      var id = photo.id.$t.replace( /\?.*$/, "" );
      this.addPhoto( albumId, {
        id    : id,
        title : photo.title.$t,
        thumb : photo['media$group']['media$thumbnail'][0].url,
        src   : photo.content.src
      } );
    }
  },
  
  registerCallback = function registerCallback( callback ) {
    window.__google_photo_cb__.push(callback);
    return __google_photo_cb__.length - 1;
  },

  provider = globals.providers.google = [];
  
  // add a global entry to store globally accessible callback functions
  window.__google_photo_cb__ = [];
  
  provider.connect = function connect( userId ) {
    return new provider.connection( userId );
  };
  
  provider.connection = function connection( userId ) {
    this.userId = userId;
  };

  provider.connection.prototype.populate = function populate( viewer ) {
    var cb = registerCallback( function(data) { 
      processAlbums.call(viewer, data);
    } );
    var base = "https://picasaweb.google.com/data/feed/base/user/" 
               + this.userId + "?alt=json-in-script";
    var url = base + "&kind=album&callback=__google_photo_cb__["+cb+"]";
    get( url );
  };

} )( Photo || window);
