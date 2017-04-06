library("readxl")
library("jsonlite")
library("ggplot2")
library("tidyr")

pat_in <- read_excel("~/Projects/Brookings/energy-innovation/build/data/Cleantech Patent By All Metro Areas.xlsx") 
pat_in <- pat_in[!is.na(pat_in$MSA), ]

pat <- pat_in
vars <- data.frame(var=paste0("V",1:length(pat)), name=names(pat))

names(pat) <- vars$var

final <- list(obs=pat, vars=vars)

json <- toJSON(final, na="null", digits=5)

writeLines(json, "~/Projects/Brookings/energy-innovation/data/energy_innovation.json")


##vis explorations
cats <- pat_in %>% gather(Category, Patents, 10:23)

gg100 <- ggplot(cats[cats$`Top 100 Metro`==1, ])
gg <- ggplot(cats)

gg + geom_histogram(aes(x=Patents), bins=60) + facet_wrap(c("Category"), ncol=4, scales="free")

gg + geom_point(aes(y=log(Patents), size=`Total Number of Cleantech Patents, 2011-2016`, 
                     x=log(`Total Number of Cleantech Patents, 2011-2016`)), 
                     alpha=0.3) + 
     facet_wrap(c("Category"), ncol=4, scales="free") + scale_size()

