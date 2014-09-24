all: nbfod.xpi

nbfod.xpi: LICENSE bootstrap.js install.rdf
	zip -u9 nbfod.xpi $^
