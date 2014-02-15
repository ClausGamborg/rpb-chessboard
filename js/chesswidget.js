/******************************************************************************
 *                                                                            *
 *    This file is part of RPB Chessboard, a Wordpress plugin.                *
 *    Copyright (C) 2013-2014  Yoann Le Montagner <yo35 -at- melix.net>       *
 *                                                                            *
 *    This program is free software: you can redistribute it and/or modify    *
 *    it under the terms of the GNU General Public License as published by    *
 *    the Free Software Foundation, either version 3 of the License, or       *
 *    (at your option) any later version.                                     *
 *                                                                            *
 *    This program is distributed in the hope that it will be useful,         *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           *
 *    GNU General Public License for more details.                            *
 *                                                                            *
 *    You should have received a copy of the GNU General Public License       *
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
 *                                                                            *
 ******************************************************************************/


/**
 * Tools to create chessboard widgets in HTML pages.
 *
 * @author Yoann Le Montagner
 * @namespace ChessWidget
 *
 * @requires chess.js {@link https://github.com/jhlywa/chess.js}
 * @requires jQuery
 */
ChessWidget = (function(Chess, $)
{
	/**
	 * Minimal value for the square-size parameter.
	 *
	 * @constant
	 * @public
	 * @memberof ChessWidget
	 */
	var MINIMUM_SQUARE_SIZE = 24;

	/**
	 * Maximal value for the square-size parameter.
	 *
	 * @constant
	 * @public
	 * @memberof ChessWidget
	 */
	var MAXIMUM_SQUARE_SIZE = 64;

	/**
	 * Increment value for the square-size parameter.
	 *
	 * @constant
	 * @public
	 * @memberof ChessWidget
	 */
	var STEP_SQUARE_SIZE = 4;


	/**
	 * @typedef {{
	 *   flip           : boolean,
	 *   squareSize     : number ,
	 *   showCoordinates: boolean
	 * }} Attributes
	 *
	 * @desc Set of options applicable to a chess widget.
	 */


	/**
	 * Root URL of the library.
	 *
	 * Use the method ChessWidget.rootURL to get the root URL of the library,
	 * instead of reading this variable directly.
	 *
	 * @type {string}
	 * @private
	 * @memberof ChessWidget
	 */
	var _rootURL = null;


	/**
	 * Return the root URL of the library.
	 *
	 * @private
	 *
	 * @returns {string}
	 *
	 * @memberof ChessWidget
	 */
	function rootURL()
	{
		if(_rootURL==null) {
			_rootURL = "";
			$("script").each(function(index, e)
			{
				var src = $(e).attr("src");
				if(src!=null && src.match(/^(.*\/)chesswidget.js(?:\?.*)?$/)) {
					_rootURL = RegExp.$1;
				}
			});
		}
		return _rootURL;
	}


	/**
	 * Return the URL to the folder containing the sprites (images representing the chess pieces),
	 * with the trailing "/" character.
	 *
	 * @private
	 *
	 * @param {number} squareSize
	 * @returns {String}
	 *
	 * @memberof ChessWidget
	 */
	function spriteBaseURL(squareSize)
	{
		var retVal = rootURL() + 'sprite/' + squareSize + '/';
		return retVal;
	}


	/**
	 * Return the URL to the sprite (a PNG image) corresponding to a given colored piece.
	 *
	 * @private
	 *
	 * @param {string} coloredPiece
	 * @param {number} squareSize
	 * @returns {String}
	 *
	 * @memberof ChessWidget
	 */
	function coloredPieceURL(coloredPiece, squareSize)
	{
		var retVal =
			spriteBaseURL(squareSize) +
			(coloredPiece==null ? 'clear' : (coloredPiece.color + coloredPiece.type)) +
			'.png';
		return retVal;
	}


	/**
	 * Return the URL to the sprite (a PNG image) corresponding to a given color flag.
	 *
	 * @private
	 *
	 * @param {string} color
	 * @param {number} squareSize
	 * @returns {string}
	 *
	 * @memberof ChessWidget
	 */
	function colorURL(color, squareSize)
	{
		var retVal = spriteBaseURL(squareSize);
		switch(color) {
			case 'w': retVal+='white.png'; break;
			case 'b': retVal+='black.png'; break;
			default: retVal+='clear.png'; break;
		}
		return retVal;
	}


	/**
	 * Validate a square-size option value.
	 *
	 * @param {object} value Value to be validated.
	 * @returns {number} Validated value.
	 *
	 * @memberof ChessWidget
	 */
	function validateSquareSize(value)
	{
		if(value==null) {
			return 32;
		}
		else {
			value = Number(value);
			value = Math.min(Math.max(value, MINIMUM_SQUARE_SIZE), MAXIMUM_SQUARE_SIZE);
			value = STEP_SQUARE_SIZE * Math.round(value / STEP_SQUARE_SIZE);
			return value;
		}
	}


	/**
	 * Create a new DOM node representing a chess diagram.
	 *
	 * @param {(Chess|string)} position Chess position to represent.
	 *
	 * If the argument is a string, the function will try to parse it as a
	 * FEN-formatted string. If the parsing fails, an empty chess position will
	 * be represented.
	 *
	 * @params {ChessWidget.Attributes} [options=null] Diagram options, or null to use the default ones.
	 * @returns {jQuery}
	 *
	 * @memberof ChessWidget
	 */
	function make(position, options)
	{
		// Default options
		if(options==null) {
			options = Object();
		}

		// If the `position` argument is a string, try to parse it as a FEN-formatted string.
		if(typeof(position)=='string') {
			position = position.replace(/^\s+|\s+$/g, '');
			position = new Chess(position);
		}

		// Read the options
		var flip             = options.flip==null ? false : Boolean(options.flip);
		var squareSize       = validateSquareSize(options.squareSize);
		var showCoordinates  = options.showCoordinates==null ? true : Boolean(options.showCoordinates);
		var whiteSquareColor = "#f0dec7"; //TODO: read this from options
		var blackSquareColor = "#b5876b"; //TODO: read this from options
		var squareColor = {light: whiteSquareColor, dark: blackSquareColor};

		// Create the returned node
		var retVal = $('<div class="ChessWidget"></div>');
		var table  = $('<div class="ChessWidget-table"></div>');
		retVal.append(table);

		// Rows, columns
		var ROWS    = flip ? ['1','2','3','4','5','6','7','8'] : ['8','7','6','5','4','3','2','1'];
		var COLUMNS = flip ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];

		// For each row...
		for(var r=0; r<8; ++r) {
			var tr = $('<div class="ChessWidget-row"></div>');
			table.append(tr);

			// If visible, the row coordinates are shown in the left-most column.
			if(showCoordinates) {
				var th = $('<div class="ChessWidget-row-header">' + ROWS[r] + '</div>');
				tr.append(th);
			}

			// Print the squares belonging to the current column
			for(var c=0; c<8; ++c) {
				var sq = COLUMNS[c] + ROWS[r];
				var td = $(
					'<div class="ChessWidget-cell" style="background-color: ' + squareColor[position.square_color(sq)] + ';">' +
						'<img src="' + coloredPieceURL(position.get(sq), squareSize) + '" />' +
					'</div>'
				);
				tr.append(td);
			}

			// Add a "fake" cell at the end of the row: this last column will contain
			// the turn flag.
			var fakeCell = $('<div class="ChessWidget-fake-cell"></div>');
			tr.append(fakeCell);

			// Add the turn flag to the current fake cell if required.
			var turn = position.turn();
			if((ROWS[r]=='8' && turn=='b') || (ROWS[r]=='1' && turn=='w')) {
				var img = $('<img src="' + colorURL(turn, squareSize) + '" />');
				fakeCell.append(img);
			}
		}

		// If visible, the column coordinates are shown at the bottom of the table.
		if(showCoordinates) {
			var tr = $('<div class="ChessWidget-row"></div>');
			table.append(tr);

			// Empty cell
			var th0 = $('<div class="ChessWidget-corner-header"></div>');
			tr.append(th0);

			// Column headers
			for(var c=0; c<8; ++c) {
				var th = $('<div class="ChessWidget-column-header">' + COLUMNS[c] + '</div>');
				tr.append(th);
			}

			// Empty cell below the "fake" cell columns
			var thFake = $('<div class="ChessWidget-fake-header"></div>');
			tr.append(thFake);
		}

		// Return the result
		return retVal;
	}


	/**
	 * Register a 'chessboard' widget in the jQuery widget framework.
	 */
	$.widget('chess.chessboard',
	{
		/**
		 * Default options.
		 */
		options:
		{
			/**
			 * String describing the chess position (FEN format).
			 */
			position: '8/8/8/8/8/8/8/8 w - - 0 1',

			/**
			 * Whether the chessboard is flipped or not.
			 */
			flip: false,

			/**
			 * Size of the squares (in pixel).
			 */
			squareSize: 32,

			/**
			 * Whether the row and column coordinates are shown or not.
			 */
			showCoordinates: true
		},


		/**
		 * The chess position.
		 * @type {Chess}
		 */
		_position: null,


		/**
		 * Constructor.
		 */
		_create: function()
		{
			this.element.addClass('chess-chessboard').disableSelection();
			this._refresh();
		},


		/**
		 * Destructor.
		 */
		_destroy: function()
		{
			this.element.removeClass('chess-chessboard').enableSelection();
		},


		/**
		 * Option setter.
		 */
		_setOption: function(key, value)
		{
			if(key=='position') {
				value = value.replace(/^\s+|\s+$/g, ''); // Trim the value.
				this._position = null; // The FEN needs to be re-parsed.
			}

			else if(key=='squareSize') {
				value = Math.min(Math.max(value, MINIMUM_SQUARE_SIZE), MAXIMUM_SQUARE_SIZE);
				value = STEP_SQUARE_SIZE * Math.round(value / STEP_SQUARE_SIZE);
			}

			this.options[key] = value;
			this._refresh();
		},


		/**
		 * Resize the widget so that it fits in a box of size `width` x `height`.
		 */
		fitIn: function(width, height)
		{
			var table = $(':first-child', this.element);
			var deltaW = width  - table.width ();
			var deltaH = height - table.height();
			var deltaWPerSq = Math.floor(deltaW / 9 / STEP_SQUARE_SIZE) * STEP_SQUARE_SIZE;
			var deltaHPerSq = Math.floor(deltaH / 8 / STEP_SQUARE_SIZE) * STEP_SQUARE_SIZE;
			var newSquareSize = Math.min(Math.max(this.options.squareSize + Math.min(deltaWPerSq, deltaHPerSq),
				MINIMUM_SQUARE_SIZE), MAXIMUM_SQUARE_SIZE);
			if(newSquareSize!=this.options.squareSize) {
				this.options.squareSize = newSquareSize;
				this._refresh();
			}
		},


		/**
		 * Refresh the widget.
		 */
		_refresh: function()
		{
			// Parse the FEN-formatted position string, if necessary.
			if(this._position==null) {
				var fen = this.options.position;
				switch(fen) {
					case 'start': fen='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; break;
					case 'empty': fen='8/8/8/8/8/8/9/8 w - - 0 1'; break;
				}
				this._position = new Chess(fen);
			}

			// Square colors
			var whiteSquareColor = "#f0dec7"; //TODO: read this from options
			var blackSquareColor = "#b5876b"; //TODO: read this from options
			var squareColor = {light: whiteSquareColor, dark: blackSquareColor};

			// Rows, columns
			var ROWS    = this.options.flip ? ['1','2','3','4','5','6','7','8'] : ['8','7','6','5','4','3','2','1'];
			var COLUMNS = this.options.flip ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];

			// Clear the target node and create the table object.
			this.element.empty();
			var table = $('<div class="ChessWidget-table"></div>').appendTo(this.element);

			// For each row...
			for(var r=0; r<8; ++r) {
				var tr = $('<div class="ChessWidget-row"></div>').appendTo(table);

				// If visible, the row coordinates are shown in the left-most column.
				if(this.options.showCoordinates) {
					$('<div class="ChessWidget-row-header">' + ROWS[r] + '</div>').appendTo(tr);
				}

				// Print the squares belonging to the current column.
				for(var c=0; c<8; ++c) {
					var sq = COLUMNS[c] + ROWS[r];
					$(
						'<div class="ChessWidget-cell" style="background-color: ' + squareColor[this._position.square_color(sq)] + ';">' +
							'<img src="' + coloredPieceURL(this._position.get(sq), this.options.squareSize) + '" />' +
						'</div>'
					).appendTo(tr);
				}

				// Add a "fake" cell at the end of the row: this last column will contain the turn flag.
				var fakeCell = $('<div class="ChessWidget-fake-cell"></div>').appendTo(tr);

				// Add the turn flag to the current fake cell if required.
				var turn = this._position.turn();
				if((ROWS[r]=='8' && turn=='b') || (ROWS[r]=='1' && turn=='w')) {
					$('<img src="' + colorURL(turn, this.options.squareSize) + '" />').appendTo(fakeCell);
				}
			}

			// If visible, the column coordinates are shown at the bottom of the table.
			if(this.options.showCoordinates) {
				var tr = $('<div class="ChessWidget-row"></div>').appendTo(table);

				// Empty cell
				$('<div class="ChessWidget-corner-header"></div>').appendTo(tr);

				// Column headers
				for(var c=0; c<8; ++c) {
					$('<div class="ChessWidget-column-header">' + COLUMNS[c] + '</div>').appendTo(tr);
				}

				// Empty cell below the "fake" cell columns
				$('<div class="ChessWidget-fake-header"></div>').appendTo(tr);
			}
		}
	});


	/**
	 * Public constants.
	 */
	$.chessboard =
	{
		MINIMUM_SQUARE_SIZE: MINIMUM_SQUARE_SIZE,
		MAXIMUM_SQUARE_SIZE: MAXIMUM_SQUARE_SIZE,
		STEP_SQUARE_SIZE   : STEP_SQUARE_SIZE
	};



	// Returned the module object
	return {
		MINIMUM_SQUARE_SIZE: MINIMUM_SQUARE_SIZE,
		MAXIMUM_SQUARE_SIZE: MAXIMUM_SQUARE_SIZE,
		STEP_SQUARE_SIZE   : STEP_SQUARE_SIZE   ,
		validateSquareSize : validateSquareSize ,
		make               : make
	};

})(Chess, jQuery);
