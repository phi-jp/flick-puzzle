/*
 * runstant
 */

phina.globalize();

var SCREEN_WIDTH      = 640;
var BOARD_PADDING     = 40;
var BOARD_WIDTH       = SCREEN_WIDTH-BOARD_PADDING*2;
var PIECE_HORIZON_NUM = 3;
var PIECE_VERTICAL_NUM= 3;
var PIECE_NUM         = PIECE_HORIZON_NUM*PIECE_VERTICAL_NUM;
var PIECE_SIZE        = (BOARD_WIDTH/PIECE_HORIZON_NUM)*0.9;

var COLOR_LIST = [
  'red',
  'green',
  'blue',
];

phina.define('MainScene', {
  superClass: 'CanvasScene',
  
  init: function() {
    this.superInit();
    

    this.pieceTable = [];
    this.pieceGroup = CanvasElement().addChildTo(this);
    
    var grid = Grid(BOARD_WIDTH, PIECE_HORIZON_NUM);
    grid.offset = grid.span(1)/2 + BOARD_PADDING;
    
    (PIECE_NUM).times(function(i) {
      var xIndex = i%PIECE_HORIZON_NUM;
      var yIndex = (i/PIECE_HORIZON_NUM).floor();
      var color = COLOR_LIST.pickup();
      var p = Piece(color).addChildTo(this.pieceGroup);
      p.x = grid.span(xIndex);
      p.y = grid.span(yIndex)+220;
      p.setInteractive(true);
      p.onpointend = function() {
        this.movePiece(p);
      }.bind(this);

      this.pieceTable[i] = p;
    }, this);
    
    var cursorPiece = this.pieceGroup.children.last;
    cursorPiece.hide();
    cursorPiece.color = null;
    this.cursorPiece = cursorPiece;
    
    this.shufflePiece();
    
    this.time = 0.0;
    this.fromJSON({
      children: {
        timerLabel: {
          className: 'Label',
          x: this.gridX.span(15),
          y: this.gridY.span(2.5),
          align: 'right',
          fontSize: 100,
          text: '15.01',
        },
      },
    });
  },
  
  update: function(app) {
    this.time += app.deltaTime;
    this.timerLabel.text = (this.time/1000).toFixed(2);
  },
  
  getPiece: function(xIndex, yIndex) {
    var index = xIndex + yIndex*PIECE_HORIZON_NUM;
    return this.pieceGroup[index];
  },

  piece2Index: function(p) {
    return this.pieceTable.indexOf(p);
  },

  piece2PosIndex: function(p) {
    var index = this.piece2Index(p);
    return {
      xIndex: index%PIECE_HORIZON_NUM,
      yIndex: (index/PIECE_HORIZON_NUM).floor(),
    };
  },

  movePiece: function(p) {
    var posIndexA = this.piece2PosIndex(p);
    var posIndexB = this.piece2PosIndex(this.cursorPiece);
    var dx = Math.abs(posIndexA.xIndex - posIndexB.xIndex);
    var dy = Math.abs(posIndexA.yIndex - posIndexB.yIndex);
    
    if ((dx === 0 && dy === 1) || (dx === 1 && dy === 0)) {
      var flow = this.swapPiece(p, this.cursorPiece, 100);
      flow.then(function() {
        this.check();
      }.bind(this));
    }
  },
  
  swapPiece: function(a, b, time) {
    var indexA = this.piece2Index(a);
    var indexB = this.piece2Index(b);
    this.pieceTable[indexA] = b;
    this.pieceTable[indexB] = a;

    if (time) {
      return Flow(function(resolve) {
        a.tweener.clear()
          .to({
            x: b.x,
            y: b.y,
          }, time, 'easeOutCubic')
          ;
        b.tweener.clear()
          .to({
            x: a.x,
            y: a.y,
          }, time, 'easeOutCubic')
          .call(function() {
            resolve();
          })
          ;
      });
    }
    else {
      var temp = a.x; a.x = b.x; b.x = temp;
      var temp = a.y; a.y = b.y; b.y = temp;

      return Flow.resolve();
    }
  },
  
  shufflePiece: function() {
    return ;
    var c = this.cursorPiece;
    
    (128).times(function() {
      var left = this.getPiece(c.xIndex-1, c.yIndex);
      var right = this.getPiece(c.xIndex+1, c.yIndex);
      var up = this.getPiece(c.xIndex, c.yIndex-1);
      var down = this.getPiece(c.xIndex, c.yIndex+1);
      var target = [left,right,up,down].filter(function(p) {
        return p != null;
      }).pickup();
      
      this.swapPiece(c, target);
    }, this);
  },

  check: function() {
    // 横チェック
    (PIECE_VERTICAL_NUM).times(function(y) {
      var pieces = [];
      (PIECE_HORIZON_NUM).times(function(x) {
        var index = y*PIECE_HORIZON_NUM+x;
        pieces.push(this.pieceTable[index]);
      }, this);

      var color = pieces.first.color;
      var result = pieces.every(function(p) {
        return p.color === color;
      });
    }, this);

    // 縦チェック
    (PIECE_HORIZON_NUM).times(function(x) {
      var pieces = [];
      (PIECE_VERTICAL_NUM).times(function(y) {
        var index = y*PIECE_HORIZON_NUM+x;
        pieces.push(this.pieceTable[index]);
      }, this);

      var color = pieces.first.color;
      var result = pieces.every(function(p) {
        return p.color === color;
      });
      console.log(result);
    }, this);
  },
});

phina.define('Piece', {
  superClass: 'RectangleShape',
  
  init: function(color) {
    this.superInit({
      stroke: false,
      width: PIECE_SIZE,
      height: PIECE_SIZE,
      cornerRadius: 10,
    });

    this.fill = {
      'red': 'hsl(0, 80%, 70%)',
      'green': 'hsl(120, 80%, 70%)',
      'blue': 'hsl(240, 80%, 70%)',
    }[color];

    this.color = color;
  },
});

phina.main(function() {
  var app = GameApp({
    title: 'Flick puzzle',
    backgroundColor: 'white',
    fontColor: '#444',
    startLabel: 'main',
  });
  
  app.run();
});
