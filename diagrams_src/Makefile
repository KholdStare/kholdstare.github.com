# Creates SVG files from diagrams,
# and PNG files from SVGs
# and copies them into diagrams folder

DIAS    = $(wildcard *.dia)
PNGS    = ${DIAS:.dia=.png} 
SVGS    = ${DIAS:.dia=.svg} 
	
all : png
	mv *.svg *.png ../diagrams/

png : $(PNGS)

# generate pngs from svgs
%.png : %.svg
	rsvg-convert --x-zoom 2 --y-zoom 2 -f png -o "$@" "$<" 

# generate svgs from dia diagrams
%.svg : %.dia
	dia -e $@ -t svg $<

clean :
	rm -f $(PNGS)
	rm -f $(SVGS)

