"use strict"

function Storage(max_points, dimension) {
  this.coordinates = new Array(dimension)
  this.points = new Array(dimension)
  for(var i=0; i<dimension; ++i) {
    this.coordinates[i] = new Int32Array(max_points<<dimension)
    this.points[i] = new Float32Array(max_points<<dimension)
  }
  this.indices = new Int32Array(max_points<<dimension)
}

Storage.prototype.resize = function(max_points) {
  var dimension = this.coordinates.length
  for(var i=0; i<dimension; ++i) {
    this.coordinates[i] = new Int32Array(max_points<<dimension)
    this.points[i] = new Float32Array(max_points<<dimension)
  }
  this.indices = new Int32Array(max_points<<dimension)
}

Storage.prototype.createWord = function() {
  return new Array(2*this.coordinates.length+1)
}

Storage.prototype.size = function() {
  return this.indices >> this.coordinates.length
}

Storage.prototype.move = function(i, j) {
  var coords = this.coordinates
    , points = this.points
    , a, b
  for(var k=0, d=coords.length; k<d; ++k) {
    a = coords[k]
    a[i] = a[j]
    b = points[k]
    b[i] = b[j]
  }
  this.indices[i] = this.indices[j]
}

Storage.prototype.load = function(scratch, i) {
  var coords = this.coordinates
    , points = this.points
  for(var k=0, d=coords.length; k<d; ++k) {
    scratch[k] = coords[k][i]|0
    scratch[k+d+1] = +points[k][i]
  }
  scratch[d] = this.indices[i]|0
}

Storage.prototype.store = function(i, scratch) {
  var coords = this.coordinates
    , points = this.points
  for(var k=0, d=coords.length; k<d; ++k) {
    coords[k][i] = scratch[k]
    points[k][i] = scratch[k+d+1]
  }
  this.indices[i] = scratch[d]
}

Storage.prototype.swap = function(i, j) {
  var coords = this.coordinates
  var points = this.points
  var ind = this.indices
  var t, a, b
  for(var k=0, d=coords.length; k<d; ++k) {
    a = coords[k]
    t = a[i]
    a[i] = a[j]
    a[j] = t
    b = points[k]
    t = b[i]
    b[i] = b[j]
    b[j] = t
  }
  t = ind[i]
  ind[i] = ind[j]
  ind[j] = t
}

Storage.prototype.compare = function(i,j) {
  var coords = this.coordinates
  for(var k=0, d=coords.length; k<d; ++k) {
    var a = coords[k]
      , s = a[i] - a[j]
    if(s) { return s }
  }
  return this.indices[i] - this.indices[j]
}

Storage.prototype.compareNoId = function(i,j) {
  var coords = this.coordinates
  for(var k=0, d=coords.length-1; k<d; ++k) {
    var a = coords[k]
      , s = a[i] - a[j]
    if(s) { return s }
  }
  return coords[d][i] - coords[d][j]
}

Storage.prototype.compareS = function(i, scratch) {
  var coords = this.coordinates
  for(var k=0, d=coords.length; k<d; ++k) {
    var s = coords[k][i] - scratch[k]
    if(s) { return s }
  }
  return this.indices[i] - scratch[d]
}

/*
  Modified from this: http://stackoverflow.com/questions/8082425/fastest-way-to-sort-32bit-signed-integer-arrays-in-javascript
 */
Storage.prototype.sort = function(n) {
  var coords = this.coordinates
  var indices = this.indices
  var dimension = coords.length
  var stack = [];
  var sp = -1;
  var left = 0;
  var right = n - 1;
  var i, j, swap = this.createWord()
  while(true) {
    if(right - left <= 25){
      for(j=left+1; j<=right; j++) {
        this.load(swap, j)
        i = j-1;
        while(i >= left && this.compareS(i, swap) > 0) {
          this.move(i+1, i--)
        }
        this.store(i+1, swap)
      }
      if(sp == -1)    break;
      right = stack[sp--];
      left = stack[sp--];
    } else {
      var median = (left + right) >> 1;
      i = left + 1;
      j = right;
      
      this.swap(median, i)
      if(this.compare(left, right) > 0) {
        this.swap(left, right)
      } if(this.compare(i, right) > 0) {
        this.swap(i, right)
      } if(this.compare(left, i) > 0) {
        this.swap(left, i)
      }
      
      this.load(swap, i)
      while(true){
        do i++; while(this.compareS(i, swap) < 0);
        do j--; while(this.compareS(j, swap) > 0);
        if(j < i)    break;
        this.swap(i,j)
      }
      this.move(left+1, j)
      this.store(j, swap)
      if(right - i + 1 >= j - left){
        stack[++sp] = i;
        stack[++sp] = right;
        right = j - 1;
      }else{
        stack[++sp] = left;
        stack[++sp] = j - 1;
        left = i;
      }
    }
  }
}

Storage.prototype.hashPoints = function(points, bucketSize, radius) {
  var floor = Math.floor
    , coords = this.coordinates
    , spoints = this.points
    , indices = this.indices
    , count = points.length|0
    , dimension = coords.length|0
    , dbits = (1<<dimension)|0
    , ptr = 0
  for(var i=0; i<count; ++i) {
    var t = ptr
      , p = points[i]
      , cross = 0
    for(var j=0; j<dimension; ++j) {
      var ix = floor(p[j]/bucketSize)
      coords[j][ptr] = ix
      spoints[j][ptr] = p[j]
      if(bucketSize*(ix+1) < p[j]+2*radius) {
        cross |= (1<<j)
      }
    }
    indices[ptr++] = i
    cross = ~cross
    for(var j=1; j<dbits; ++j) {
      if(j & cross) {
        continue
      }
      for(var k=0; k<dimension; ++k) {
        var c = coords[k]
        c[ptr] = c[t]+((j>>>k)&1)
        spoints[k][ptr] = p[k]
      }
      indices[ptr++] = i
    }
  }
  return ptr
}

Storage.prototype.findPairs = function(cellCount, bucketSize, radius, cb) {
  var floor = Math.floor
    , coords = this.coordinates
    , points = this.points
    , indices = this.indices
    , dimension = coords.length|0
    , ptr = 0
    , r2 = 4 * radius * radius
    , i,j,k, l
    , a, b, pa, pb, d, d2, ac, bc
  for(i=0; i<cellCount;) {
    for(j=i+1; j<cellCount; ++j) {
      if(this.compareNoId(i, j) !== 0) {
        break
      }
      a = indices[j]
k_loop:
      for(k=i; k<j; ++k) {
        b = indices[k]
        d2 = 0.0
        for(l=0; l<dimension; ++l) {
          ac = points[l][j]
          bc = points[l][k]
          if(ac > bc) {
            if(coords[l][i] !== floor(ac/bucketSize)) {
              continue k_loop
            }
          } else if(coords[l][i] !== floor(bc/bucketSize)) {
            continue k_loop
          }
          d = ac - bc
          d2 += d * d
          if(d2 > r2) {
            continue k_loop
          }
        }
        if(cb(a, b, d2)) {
          return
        }
      }
    }
    i = j
  }
}

function findPairs(points, radius, cb, grid) {
  if(points.length === 0) {
    return
  }
  var count = points.length|0
  var dimension = points[0].length|0
  var cellCount = count<<dimension
  if(!grid) {
    grid = new Storage(count, dimension)
  } else if(grid.size() < cellCount) {
    grid.resize(count)
  }
  var bucketSize = 2*radius
  var nc = grid.hashPoints(points, bucketSize, radius)
  grid.sort(nc)
  grid.findPairs(nc, bucketSize, radius, cb)
}

module.exports = findPairs
module.exports.allocateStorage = function(n, d) { return new Storage(n, d) }
