# Creates SVG files from diagrams,
# PNG files from SVGs
# and copies them into diagrams folder

SOURCE_DIAS    = $(wildcard *.dia)
SOURCE_DRAWIO  = $(wildcard *.svg.drawio)
SVGS    = $(addprefix ../diagrams/,${SOURCE_DIAS:.dia=.svg} ${SOURCE_DRAWIO:.svg.drawio=.svg}) 
PNGS    = ${SVGS:.svg=.png}
	
.PHONY: all svg png
all : png

# generate svgs from dia diagrams
# make sure whitespace is preserved, for code
../diagrams/%.svg : %.dia
	dia -e $@ -t svg $<
	sed -i -r -e 's/(<tspan [^>]*)>/\1 xml:space="preserve">/' $@

../diagrams/%.svg : %.svg.drawio
	sed -r -e 's/Viewer does not support full SVG 1.1//g' $< > $@

# generate pngs from svgs
../diagrams/%.png : ../diagrams/%.svg
	rsvg-convert --width=1024 --keep-aspect-ratio -f png -o "$@" "$<" 

svg : $(SVGS)
png : $(PNGS)

clean :
	rm -f $(PNGS)
	rm -f $(SVGS)

