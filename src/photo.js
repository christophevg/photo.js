(function(globals) {

  var
  
  indexOf = function indexOf( array, item ) {
    var len = array.length;
    for( var i=0 ; i<len; i++) {
      if( i in array && array[i] === item ) {
        return i;
      }
    }
    return -1;
  },
  
  createImage = function createImage( attrs ) {
    var container = document.createElement( "DIV" );
    container.className = "container " + attrs.classes;

    var img = document.createElement( "IMG" );
    img.className = attrs.classes;
    if( typeof attrs.onload == "function" ) {
      img.onload = attrs.onload;
    }
    img.src       = attrs.src;
    if( typeof attrs.onclick == "function" ) {
      img.onclick   = attrs.onclick;
    }

    container.appendChild(img);

    if( attrs.title ) {
      var title = document.createElement( "DIV" );
      title.className = "title " + attrs.classes;
      title.innerHTML = attrs.title;
      container.appendChild(title);
    }
    
    return container;
  },
  
  watchHash = function watchHash() {
    var hash = window.location.hash.replace( /^#/, "");
    if( this.lastHash == hash ) { return; }
    this.lastHash = hash;

    // empty hash -> show albums
    if( hash == "" ) {
      return this.selectAlbums();
    }

    // else we might have an albumId and maybe a photoId
    if( matches = hash.match( /([0-9]+)(\/)?([0-9]+)?$/ ) ) {
       var albumId = matches[1];
       var photoId = matches[3];
       
       if( photoId ) {
         setAlbum.call( this, albumId, true );
         if( ! this.selectPhoto( photoId ) ) { this.lastHash = null; }
       } else {
         if( ! this.selectAlbum( albumId ) ) { this.lastHash = null; }
       }
    }
  },
  
  setHash = function setHash(id) {
    if( window.location.hash.replace( /^#/, "") == id ) { return; }

    var hash = "";
    if( id != "" ) {
      hash = "#" + id;
    }
    window.location.hash = hash;
  },
  
  startHashWatcher = function startHashWatcher() {
    setInterval( (function(viewer) { 
                   return function() { watchHash.apply(viewer); }
                 } )(this), 25 );
  },

  setAlbum = function setAlbum( albumId, setDefault ) {
    if( this.cache.albums[albumId] ) { 
      this.currentAlbum = albumId;
      this.refreshAlbum();
      // set the first photo from the album
      if( ! setDefault ) { 
        setPhoto.call( this, this.cache.albums[albumId].photos[0] );
      }
      return true;
    }
    return false;
  },

  setPhoto = function setPhoto( photoId ) {
    if( this.cache.photos[photoId] ) { 
      this.currentPhoto = photoId;
      this.refreshPhoto();
      return true;
    }
    return false;
  },
  
  Photo = globals.Photo = {};

  // public API  
  Photo.activate = function activate( id ) {
    return new Photo.viewer( id );
  }
  
  Photo.providers = {};

  Photo.viewer = function viewer( id ) {
    this.providers = [];
    this.albums = document.getElementById( id + "albums" );
    this.table  = document.getElementById( id + "table"  );
    this.thumbs = document.getElementById( id + "thumbs" );
    this.photo  = document.getElementById( id + "photo"  );
    this.clearCache();
    startHashWatcher.apply(this);
  },

  Photo.viewer.prototype.useDataProvider = 
    function useDataProvider( provider ) {
      this.providers.push( provider );
      provider.populate(this);
      return this;
    };

  Photo.viewer.prototype.onShowAlbums = function onShowAlbums( cb ) {
    if( typeof cb == "function" ) { this.handleShowAlbums = cb; }
    return this;
  };

  Photo.viewer.prototype.onAlbumSelection = function onAlbumSelection( cb ) {
    if( typeof cb == "function" ) { this.handleAlbumSelection = cb; }
    return this;
  };

  Photo.viewer.prototype.onPreviewSelection = function onPreviewSelection(cb){
    if( typeof cb == "function" ) { this.handlePreviewSelection = cb; }
    return this;
  };

  Photo.viewer.prototype.onPhotoSelection = function onPhotoSelection(cb){
    if( typeof cb == "function" ) { this.handlePhotoSelection = cb; }
    return this;
  };

  Photo.viewer.prototype.onPhotoLoad = function onPhotoLoad(cb){
    if( typeof cb == "function" ) { this.handlePhotoLoad = cb; }
    return this;
  };
  
  Photo.viewer.prototype.clearCache = function clearCache() {
    this.currentAlbum = null;
    this.currentPhoto = null;
    this.cache = { albums : {}, photos : {} };
    return this;
  };
  
  Photo.viewer.prototype.gotoAlbums = function gotoAlbums() {
    setHash.call( this, "" );
    return this;
  };
  
  Photo.viewer.prototype.gotoTable = function gotoTable() {
    setHash.call( this, this.currentAlbum );
    return this;
  };
  
  Photo.viewer.prototype.gotoPhoto = function gotoPhoto() {
    setHash.call( this, this.currentPhoto );
    return this;
  };
  
  Photo.viewer.prototype.addAlbum = function addAlbum( album ) {
    album.photos = [];
    this.cache.albums[album.id] = album;

    // a new album is added, so we want album previews to be refreshed
    this.refreshAlbums();

    return this;
  };
  
  Photo.viewer.prototype.addPhoto = function addPhoto( albumId, photo ) {
    this.cache.photos[photo.id] = photo;
    this.cache.albums[albumId].photos.push(photo.id); // ordered list

    // if we added a picture to the currently viewed album, refresh the album
    // previews
    if( this.currentAlbum == albumId ) { this.refreshAlbum(); }

    return this;
  };
  
  Photo.viewer.prototype.refreshAlbums = function refreshAlbums() {
    this.albums.innerHTML = "";
    for( var id in this.cache.albums ) {
      var album = this.cache.albums[id];
      this.albums.appendChild( createImage( {
        classes : "album thumb",
        src     : album.thumb,
        title   : album.title,
        onclick : (function(viewer,albumId) {
                    return function() {
                       viewer.selectAlbum.call(viewer, albumId);
                    } } )(this, album.id)
      } ) );
    }
    return this;
  };

  Photo.viewer.prototype.refreshAlbum = function refreshAlbum() {
    this.table.innerHTML = "";
    this.thumbs.innerHTML = "";

    var albumId = this.currentAlbum;
    for( var i=0; i<this.cache.albums[albumId].photos.length; i++ ) {
      var photo = this.cache.photos[this.cache.albums[albumId].photos[i]];
      // add it to the table
      this.table.appendChild( createImage( {
        classes : "thumb",
        src     : photo.preview,
        onclick : (function(viewer, photoId) { 
                    return function() { 
                      viewer.selectPreview.call(viewer, photoId);
                    } } )(this, photo.id)
      } ) );
      // add it to the thumbs
      this.thumbs.appendChild( createImage( {
        classes : "thumb",
        src     : photo.thumb,
        onclick : (function(viewer, photoId) { 
                    return function() { 
                      viewer.selectPhoto.call(viewer, photoId);
                    } } )(this, photo.id)
      } ) );
    }
    
    return this;
  };
  
  Photo.viewer.prototype.refreshPhoto = function refreshPhoto() {
    this.photo.innerHTML = "";
    this.photo.appendChild( createImage( {
      classes : "full",
      onload  : this.handlePhotoLoad,
      src     : this.cache.photos[this.currentPhoto].src
    } ) );
    
    return this;
  };
  
  Photo.viewer.prototype.selectAlbums = function selectAlbums() {
    // notify the client
    if( typeof this.handleShowAlbums == "function" ) {
       this.handleShowAlbums();
    }
  };
  
  Photo.viewer.prototype.selectAlbum = function selectAlbum( albumId ) {
    if( setAlbum.call( this, albumId ) ) {
      if( typeof this.handleAlbumSelection == "function" ) {
       this.handleAlbumSelection();
      }
      setHash.call(this, this.currentAlbum);
      return true;
    }
    return false;
  };
  
  Photo.viewer.prototype.selectPreview = function selectPreview( photoId ) {
    if( setPhoto.call( this, photoId ) ) {
      if( typeof this.handlePreviewSelection == "function" ) {
        this.handlePreviewSelection();
      }
      setHash.call(this, this.currentAlbum + "/" + this.currentPhoto);
      return true;
    }
    return false;
  };

  Photo.viewer.prototype.selectPhoto = function selectPhoto( photoId ) {
    if( setPhoto.call( this, photoId ) ) {
      if( typeof this.handlePhotoSelection == "function" ) {
        this.handlePhotoSelection();
      }
      setHash.call(this, this.currentAlbum + "/" + this.currentPhoto);
      return true;
    }
    return false;
  };
  
  Photo.viewer.prototype.selectNextPhoto = function selectNextPhoto() {
    var photos = this.cache.albums[this.currentAlbum].photos;
    var currentIdx = indexOf( photos, this.currentPhoto );
    if( currentIdx == -1 ) { return false; }
    if( currentIdx < photos.length - 1 ) {
      var nextIdx = currentIdx + 1;
    } else {
      var nextIdx = 0;
    }
    setPhoto.call( this, photos[nextIdx] );
  };

  Photo.viewer.prototype.selectPreviousPhoto = function selectPreviousPhoto(){
    var photos = this.cache.albums[this.currentAlbum].photos;
    var currentIdx = indexOf( photos, this.currentPhoto );
    if( currentIdx == -1 ) { return false; }
    if( currentIdx > 0 ) {
      var prevIdx = currentIdx - 1;
    } else {
      var prevIdx = photos.length - 1;
    }
    setPhoto.call( this, photos[prevIdx] );
  };

}) ( window );
