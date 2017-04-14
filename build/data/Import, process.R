library("readxl")
library("jsonlite")
library("ggplot2")
library("tidyr")
library("dplyr")
library("metromonitor")

pat_in <- read_excel("~/Projects/Brookings/energy-innovation/build/data/Cleantech Patent By All Metro Areas.xlsx") 
pat_in <- pat_in[!is.na(pat_in$MSA), ]

cumul <- pat_in[order(-pat_in$`Total Number of Cleantech Patents, 2011-2016`), ]
cumul$ns <- nameshort(cumul$MSA)
cumul$met <- factor(cumul$ns, cumul$ns)
cumul$cumul <- 0
cum <- 0

for(i in 1:nrow(cumul)){
  cum <- cum + cumul[i, "Total Number of Cleantech Patents, 2011-2016"]
  cumul[i, "cumul"] <- cum/cumul[1,"Total Number of U.S. Cleantech Patents 2011-2016"]
}

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

#pull in national trend
trends <- read_excel("~/Projects/Brookings/energy-innovation/build/data/handoff/Cleantech Patent_Graphics 3.23.2017.xlsx", sheet=1, skip=9)[1:16, ]
names(trends) <- c("year", "cleantech", "all")
trends$cleantech_idx <- 100*(trends$cleantech / trends$cleantech[1])
trends$all_idx <- 100*(trends$all / trends$all[1])
trends$clean_share <- 100*(trends$cleantech/trends$all)

ggtrend <- ggplot(trends)
ggtrend + geom_line(aes(x=year, y=all_idx), colour="#999999") + 
          geom_line(aes(x=year, y=cleantech_idx), colour="#31a354") + 
          geom_point(aes(x=year, y=cleantech_idx), colour="#31a354") + 
          scale_x_continuous(breaks=2001:2016) + 
          scale_y_continuous(breaks=seq(80,240,20)) +
          theme_bw()

#pull in category shares
shares <- read_excel("~/Projects/Brookings/energy-innovation/build/data/handoff/Cleantech Patent_Graphics 3.23.2017.xlsx", sheet=2)[1:14, 1:2]
names(shares) <- c("category", "share")
shares$category <- gsub("^\\s|\\s$", "", shares$category)

#pull in category growth
catgrowth <- read_excel("~/Projects/Brookings/energy-innovation/build/data/handoff/Cleantech Patent_Graphics 3.23.2017.xlsx", sheet=3, skip=11)[1:14, 1:3]
names(catgrowth) <- c("category", "a_01_10", "b_11_16")
catgrowth$category <- gsub("^\\s|\\s$", "", catgrowth$category)
#catgrowth$faster <- ifelse(catgrowth$growth_1116 >= catgrowth$growth_0110, "b", "a")
catgrowth$c_diff <- catgrowth$b_11_16 - catgrowth$a_01_10

#merge...
cdistro <- merge(shares, catgrowth, by="category", all=TRUE)
cdistro$catfact <- factor(cdistro$category, cdistro[order(cdistro$share), ]$category)
cdistro$catfact2 <- factor(cdistro$category, cdistro[order(cdistro$c_diff), ]$category)

filter(as.data.frame(table(cdistro$category, cdistro$catfact)), Freq==1)
filter(as.data.frame(table(cdistro$category, cdistro$catfact2)), Freq==1)

cdistro$dummy <- 1

#plot
ggshares <- ggplot(cdistro) + 
            geom_bar(aes(y=share, x=catfact), stat="identity", width=0.5) + 
            facet_wrap("dummy") +
            coord_flip() + 
            theme_bw()

ggrowth <- ggplot(gather(cdistro, period, growth, a_01_10:c_diff)) + 
           geom_bar(aes(y=100*growth, x=catfact, fill=ifelse(growth<0, "a", "b") ), stat="identity", width=0.5) + 
           geom_hline(yintercept=0, colour="#333333") +
           facet_wrap("period") + 
           coord_flip() + 
           theme_bw()

library(gtable)
library(grid) 
library(gridExtra)

grid.arrange(ggshares, ggrowth, nrow=1, widths=c(1,2))

#cumulative distribution
cumul$n <- 1:nrow(cumul)
ggcum <- ggplot(cumul)
ggcum + geom_bar(aes(x=met, y=cumul, fill=ifelse(n<=10, "#31a354", ifelse(n<=20, "#75d693", "#cccccc"))), stat="identity") +
        theme(axis.text.x = element_text(angle = 90, hjust = 1))

#all together


#slope + geom_point(aes(x=t, y=growth)) + geom_line(aes(x=t, y=growth, group=category, colour=faster))



