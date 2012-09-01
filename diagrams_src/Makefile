# Creates SVG files from diagrams,
# PNG files from SVGs
# and copies them into diagrams folder

DIAS    = $(wildcard *.dia)
PNGS    = ${DIAS:.dia=.png} 
SVGS    = ${DIAS:.dia=.svg} 
	
all : png
	mv *.svg *.png ../diagrams/

png : $(PNGS)

# generate pngs from svgs
%.png : %.svg
	rsvg-convert --width=1024 --keep-aspect-ratio -f png -o "$@" "$<" 

svg : $(SVGS)

# generate svgs from dia diagrams
# make sure whitespace is preserved, for code
%.svg : %.dia
	dia -e $@ -t svg $<
	sed -i -r -e 's/(<tspan [^>]*)>/\1 xml:space="preserve">/' $@

clean :
	rm -f $(PNGS)
	rm -f $(SVGS)

