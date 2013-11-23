# Creates SVG files from diagrams,
# PNG files from SVGs
# and copies them into diagrams folder

DIAS    = $(wildcard *.dia)
PNGS    = $(addprefix ../diagrams/,${DIAS:.dia=.png})
SVGS    = $(addprefix ../diagrams/,${DIAS:.dia=.svg})
	
all : png

png : $(PNGS)

# generate pngs from svgs
../diagrams/%.png : ../diagrams/%.svg
	rsvg-convert --width=1024 --keep-aspect-ratio -f png -o "$@" "$<" 

svg : $(SVGS)

# generate svgs from dia diagrams
# make sure whitespace is preserved, for code
../diagrams/%.svg : %.dia
	dia -e $@ -t svg $<
	sed -i -r -e 's/(<tspan [^>]*)>/\1 xml:space="preserve">/' $@

clean :
	rm -f $(PNGS)
	rm -f $(SVGS)

