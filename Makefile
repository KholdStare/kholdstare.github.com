
.PHONY : all presentations diagrams

all : presentations diagrams

presentations :
	$(MAKE) -C ./presentations

diagrams :
	$(MAKE) -C ./diagrams_src
