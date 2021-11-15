console.log("Literary Structure Analysis");

var q = d3.text("/Alice-text-raw.txt", function(raw_text) {
    //console.log(data);

    var formatted = createJSONstructure(raw_text);
    
    console.log(formatted);

    return formatted;

});

Sunburst(q, {
    value: d => d.size, // size of each node (file); null for internal nodes (folders)
    label: d => d.name, // display name for each cell
    title: (d, n) => `${n.ancestors().reverse().map(d => d.data.name).join(".")}\n${n.value.toLocaleString("en")}`, // hover text
    link: (d, n) => n.children
      ? `https://github.com/prefuse/Flare/tree/master/flare/src/${n.ancestors().reverse().map(d => d.data.name).join("/")}`
      : `https://github.com/prefuse/Flare/blob/master/flare/src/${n.ancestors().reverse().map(d => d.data.name).join("/")}.as`,
    width: 1152,
    height: 1152
  })

//
//
// Sunburst function
//
//

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/sunburst
function Sunburst(data, { // data is either tabular (array of objects) or hierarchy (nested objects)
    path, // as an alternative to id and parentId, returns an array identifier, imputing internal nodes
    id = Array.isArray(data) ? d => d.id : null, // if tabular data, given a d in data, returns a unique identifier (string)
    parentId = Array.isArray(data) ? d => d.parentId : null, // if tabular data, given a node d, returns its parent’s identifier
    children, // if hierarchical data, given a d in data, returns its children
    value, // given a node d, returns a quantitative value (for area encoding; null for count)
    sort = (a, b) => d3.descending(a.value, b.value), // how to sort nodes prior to layout
    label, // given a node d, returns the name to display on the rectangle
    title, // given a node d, returns its hover text
    link, // given a node d, its link (if any)
    linkTarget = "_blank", // the target attribute for links (if any)
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    margin = 1, // shorthand for margins
    marginTop = margin, // top margin, in pixels
    marginRight = margin, // right margin, in pixels
    marginBottom = margin, // bottom margin, in pixels
    marginLeft = margin, // left margin, in pixels
    padding = 1, // separation between arcs
    radius = Math.min(width - marginLeft - marginRight, height - marginTop - marginBottom) / 2, // outer radius
    color = d3.interpolateRainbow, // color scheme, if any
    fill = "#ccc", // fill for arcs (if no color encoding)
    fillOpacity = 0.6, // fill opacity for arcs
  } = {}) {
  
    // If a path accessor is specified, we can impute the internal nodes from the slash-
    // separated path; otherwise, the tabular data must include the internal nodes, not
    // just leaves. TODO https://github.com/d3/d3-hierarchy/issues/33
    if (path != null) {
      const D = d3.map(data, d => d);
      const I = d3.map(data, path).map(d => (d = `${d}`).startsWith("/") ? d : `/${d}`);
      const paths = new Set(I);
      for (const path of paths) {
        const parts = path.split("/");
        while (parts.pop(), parts.length) {
          const path = parts.join("/") || "/";
          if (paths.has(path)) continue;
          paths.add(path), I.push(path), D.push(null);
        }
      }
      id = (_, i) => I[i];
      parentId = (_, i) => I[i] === "/" ? "" : I[i].slice(0, I[i].lastIndexOf("/")) || "/";
      data = D;
    }
  
    // If id and parentId options are specified (perhaps implicitly via the path option),
    // use d3.stratify to convert tabular data to a hierarchy; otherwise we assume that
    // the data is specified as an object {children} with nested objects (a.k.a. the
    // “flare.json” format), and use d3.hierarchy.
    const root = id == null && parentId == null
        ? d3.hierarchy(data, children)
        : d3.stratify().id(id).parentId(parentId)(data);
  
    // Compute the values of internal nodes by aggregating from the leaves.
    value == null ? root.count() : root.sum(value);
  
    // Sort the leaves (typically by descending value for a pleasing layout).
    if (sort != null) root.sort(sort);
  
    // Compute the partition layout. Note polar coordinates: x is angle and y is radius.
    d3.partition().size([2 * Math.PI, radius])(root);
  
    // Construct a color scale.
    if (color != null) {
      color = d3.scaleSequential([0, root.children.length - 1], color).unknown(fill);
      root.children.forEach((child, i) => child.index = i);
    }
  
    // Construct an arc generator.
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 2 * padding / radius))
        .padRadius(radius / 2)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1 - padding);
  
    const svg = d3.create("svg")
        .attr("viewBox", [-marginLeft - radius, -marginTop - radius, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle");
  
    const cell = svg
      .selectAll("a")
      .data(root.descendants())
      .join("a")
        .attr("xlink:href", link == null ? null : d => link(d.data, d))
        .attr("target", link == null ? null : linkTarget);
  
    cell.append("path")
        .attr("d", arc)
        .attr("fill", color ? d => color(d.ancestors().reverse()[1]?.index) : fill)
        .attr("fill-opacity", fillOpacity);
  
    if (label != null) cell
      .filter(d => (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10)
      .append("text")
        .attr("transform", d => {
          if (!d.depth) return;
          const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
          const y = (d.y0 + d.y1) / 2;
          return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .attr("dy", "0.32em")
        .text(d => label(d.data, d));
  
    if (title != null) cell.append("title")
        .text(d => title(d.data, d));
  
    return svg.node();
  }

//
//
// Download JSON
//
//

function export2txt(originalData) {  
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(originalData, null, 2)], {
      type: "text/plain"
    }));
    a.setAttribute("download", "data.txt");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

//
//
// Nested JSON Structure
//
//

function createJSONstructure(t) {

    var whole_book = {  name: "Book 1",
                        title: "Alice's Adventures in Wonderland",
                        children_are: "Chapters",
                        children: split_into_chapters(t) };
    
                        //console.log(whole_book);
    return whole_book;

}


function split_into_chapters(s) {

    //console.log(s);

    var regEx = new RegExp('CHAPTER '
                            +'[A-Z]*'
                            +'\.\n'
                            ); //split by word 'CHAPTER' then roman numerals and period
    var chapters_array = s.split(regEx); 
    chapters_array.shift(); // remove first thing in array because its blank

    //console.log(chapters_array);

    var chapter_count = 0;
    var chapter_array = [];
    chapters_array.forEach( function (d) {
        
        //console.log(d);

        chapter_count++; 
        return chapter_array.push( {name: "Chapter "+chapter_count, 
                                    title: extract_chapter_title(d), 
                                    children_are: "Paragraphs", 
                                    chapter_no: chapter_count, 
                                    children: split_into_paragraphs(d) 
                                    }) 
    });
    
    //console.log(chapter_array);
    return chapter_array; 

} //--end of split chapters


function extract_chapter_title(chapter){

    var first_line = chapter.split('\n')[0];
    //console.log(first_line);

    return first_line;
} //--end of extract ch title


function split_into_paragraphs(chapter){

    var paragraph_edit = chapter    .replace(/[*]/gm, "")
                                    //.replace(/--/gm, " ")
                                    .replace(/\s(?=\S)/gm, ' ')
                                    .replace(/\s{3,}/gm, "\n")
                                    .replace(/-/gm, ' ')
                                    .replace(/^ /, '');

    var paragraph_array = paragraph_edit.split("\n");

    paragraph_array.shift();
    paragraph_array.pop();

    var paragraph_count = 0;
    var paragraph_array_of_objects = [];

    paragraph_array.forEach( function(f) {
        paragraph_count++;
        return  paragraph_array_of_objects.push( {  name: "Paragraph "+paragraph_count,
                                                    title: "Paragraph "+paragraph_count,
                                                    children_are: "Sentences",
                                                    paragraph_no: paragraph_count,
                                                    children: split_into_sentences(f) 
                                                })
     })

    //console.log(paragraph_array_of_objects);

    return paragraph_array_of_objects;
} //--end of split into paragraphs


function split_into_sentences(paragraph) {

    //console.log(paragraph);

    // var sentences_formatted = paragraph.replace(/([.?!])(\s|\)|["'])(?!( said)|( he said))/g, "$1|").split("|");
    var sentences_formatted = paragraph.replace(/([.?!])(\s|\)|["'])(?!( [a-z]))/g, "$1|").split("|");
    var sentences_cleaned = sentences_formatted.filter(entry => entry.trim() != '');
    //console.log(sentences_cleaned);

    var sentence_count = 0;
    var sentence_array_of_objects = [];

    sentences_cleaned.forEach( function(g) {
        sentence_count++;
        return sentence_array_of_objects.push({ name: "Sentence "+sentence_count,
                                                children_are: "Words",
                                                sentence_no: sentence_count,
                                                sentence: g,
                                                size: g.split(' ').length,
                                                alice: g.indexOf("Alice") })
                                                //children: split_into_words(g) 
    })

    //console.log(sentence_array_of_objects);

    return sentence_array_of_objects;
} //--end of split into sentences
