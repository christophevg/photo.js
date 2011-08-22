(function(globals) {

  var
  
  createImage = function createImage( attrs ) {
    var container = document.createElement( "DIV" );
    container.className = "container " + attrs.classes;

    var img = document.createElement( "IMG" );
    img.className = attrs.classes;
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
  },

  Photo.viewer.prototype.useDataProvider = 
    function useDataProvider( provider ) {
      this.providers.push( provider );
      provider.populate(this);
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
  
  Photo.viewer.prototype.clearCache = function clearCache() {
    this.currentAlbum = null;
    this.currentPhoto = null;
    this.cache = { albums : {}, photos : {} };
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
        onclick : (function(viewer) {
                    return function() {
                       viewer.selectAlbum.call(viewer, album.id);
                    } } )(this)
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
      src     : this.cache.photos[this.currentPhoto].src
    } ) );
    return this;
  };
  
  Photo.viewer.prototype.selectAlbum = function selectAlbum( albumId ) {
    if( this.currentAlbum != albumId ) { 
      this.currentAlbum = albumId;
      this.refreshAlbum();
      // select the first photo of the newly selected album
      this.selectPhoto( this.cache.albums[albumId].photos[0] );
    }
    
    // notify the client
    if( typeof this.handleAlbumSelection == "function" ) {
       this.handleAlbumSelection.apply(this);
    }
    return this;
  };
  
  Photo.viewer.prototype.selectPreview = function selectPreview( photoId ) {
    this.selectPhoto( photoId );
    // notify the client
    if( typeof this.handlePreviewSelection == "function" ) {
      this.handlePreviewSelection.apply(this);
    }
    return this;
  };

  Photo.viewer.prototype.selectPhoto = function selectPhoto( photoId ) {
    if( this.currentPhoto == photoId ) { return this; }
    this.currentPhoto = photoId;
    this.refreshPhoto();
    // notify the client
    if( typeof this.handlePhotoSelection == "function" ) {
      this.handlePhotoSelection.apply(this);
    }
    return this;
  };

}) ( window );
