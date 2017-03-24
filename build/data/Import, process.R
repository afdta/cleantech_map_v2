library("readxl")
library("jsonlite")

pat_in <- read_excel("~/Projects/Brookings/energy-innovation/build/data/Cleantech Patent By All Metro Areas.xlsx") 
pat_in <- pat_in[!is.na(pat_in$MSA), ]

vars <- data.frame(var=paste0("V",1:length(pat_in)), name=names(pat_in))

names(pat_in) <- vars$var

final <- list(obs=pat_in, vars=vars)

json <- toJSON(final, na="null", digits=5)

writeLines(json, "~/Projects/Brookings/energy-innovation/data/energy_innovation.json")
