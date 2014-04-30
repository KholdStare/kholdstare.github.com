MD_SOURCES := $(shell find . -iname "*.markdown" | grep -v './reveal')

HTML_RESULTS := $(addsuffix .html,$(basename $(MD_SOURCES)))

.PHONY: all

all: $(HTML_RESULTS)

%.html: %.markdown reveal.template Makefile
	pandoc --from=markdown+yaml_metadata_block --tab-stop=3 --no-highlight -t revealjs --template reveal.template -o $@ $<

clean:
	-rm -f $(HTML_RESULTS)
