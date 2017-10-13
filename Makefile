SRC = public/js/app.js public/js/directives.js public/js/filters.js public/js/controllers.js public/js/services.js

hint:
	./node_modules/.bin/jshint --onevar false public/js/*.js

build: $(SRC)
	cat $^ > public/js/home-expenses.js

min: build
	./node_modules/.bin/uglifyjs --no-mangle public/js/home-expenses.js > public/js/home-expenses.min.js
	
min2: build	
	java -jar ../../closure-compiler/compiler.jar --js public/js/home-expenses.js --compilation_level SIMPLE_OPTIMIZATIONS --language_in=ECMASCRIPT5_STRICT --js_output_file public/js/home-expenses.min.js