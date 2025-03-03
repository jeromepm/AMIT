function open_close(div_id) {
  let d = document.getElementById(div_id);
  if (div_id == "sNav"){
    d.style.width = d.style.width == "250px" ? '0' : "250px";
  } else {
    d.style.display = (d.style.display == "none") ? d.style.display = "block" : d.style.display = "none";
  }
  
}

function close_model(){
  document.getElementById("modal").style.display = "none";
}

function display_modal(title,content,color){
  document.getElementById("modal-header").style.backgroundColor  = color
  document.getElementById("modal-title").innerHTML = title
  document.getElementById("modal-body").innerHTML = ''
  document.getElementById("modal-body").appendChild(content)
  document.getElementById("modal").style.display = "flex";
}


function open_content(b){
  b.classList.toggle("active");
  var content = b.nextElementSibling;
  if (content.style.display === "block") {
    content.style.display = "none";
  } else {
    content.style.display = "block";
  }  
}

function add_new(entry_type){
    console.log(entry_type)
    if (entry_type == 'folders'){
      let d = document.getElementById('directories_div');
      let entries = document.getElementsByClassName('folder_entry');
      if (d.style.display == 'none') { d.style.display = 'block'; return; }
      var has_control = false
      console.log(entries.length)
      //Validation on entries
      for (let i = 0; i < entries.length; i++) {
        //console.log(entries[i].children)
        for (let j = 0; j < entries[i].children.length; j++){
          //Check the folder name field
          if (entries[i].children[j].name == 'folder_name'){
            //Check if the folder name contains only spaces or zero length
            if(entries[i].children[j].value.trim().length == 0){
              console.log('Error: The folder name must not be zero length')
            } else {
              var t = entries[i].children[j].value;
              t = t.trim()
              t = t.replace(/ /g,"_")
              entries[i].children[j].value = t;
              entries[i].children[j].disabled = true;
            }
          }
          //check if the review folder is created (Should be first)
          if (entries[i].children[j].name == 'review'){
            if (i == 0 && entries[i].children[j].checked == false){
              console.log("Error: The first folder should be your review folder")
            } else {
              entries[i].children[j].disabled = true;
            }
          } else if (entries[i].children[j].name == 'control'){
            console.log(entries[i].children[j].checked)
            console.log(i)
            if (i == 1 && entries[i].children[j].checked == false){
              console.log("Error: The second folder should be your review folder")
            } else {
              entries[i].children[j].disabled = true;
            }
          } else if (entries[i].children[j].name == 'backup'){
            if (i < 3 && entries[i].children[j].checked == false){
            console.log("Error: Control Folders can only be slected when one non control or review folder has been   created.")
            } else {
              entries[i].children[j].disabled = true;
            }
          }
        }
      }
      //Passes Validation Add new folder sections
      const entry = document.createElement("div");
      entry.classList.add('folder_entry')
      let lbl = document.createElement("label");
      lbl.for = "folder_name"
      lbl.innerText = "Folder Name:"
    } else if (entry_type == 'source'){
      var array = ["url","RTSP"];
      const entry = document.createElement("div");
      entry.classList.add('source_entry')
      let lbl = document.createElement("label");
      lbl.for = "slocation"
      lbl.innerText = "Location:"
      entry.appendChild(lbl)
      let input_t = document.createElement("input");
      input_t.type = "text";
      input_t.name = "slocation";
      input_t.classList.add('source_data')
      entry.appendChild(input_t)
      lbl = document.createElement("label");
      lbl.for = "stype"
      lbl.innerText = "Type:"
      entry.appendChild(lbl)
      var select = document.createElement("select");
      select.id = "stype";
      select.name = "stype";
      entry.appendChild(select);
      //Create and append the options
      for (var i = 0; i < array.length; i++) {
          var option = document.createElement("option");
          option.value = array[i];
          option.text = array[i];
          select.appendChild(option);
      }
      lbl = document.createElement("label");
      lbl.for = "surl"
      lbl.innerText = "URL:"
      entry.appendChild(lbl)
      input_t = document.createElement("input");
      input_t.type = "text";
      input_t.name = "surl";
      input_t.classList.add('source_data')
      entry.appendChild(input_t)
      document.getElementById('sources').appendChild(entry)
      document.getElementById('sources').appendChild(document.createElement("br"))
      return

      let text = document.getElementById("pname").value;
      let desc = document.getElementById("pdescr").value;
      let l = document.getElementById("lnames").value;
      let labels = l.split(",")
      real_labels = labels.filter(function(v) { return v !== '' })
      let d = document.createElement("div")
      let p = document.createElement("p")
      text = 'Save Project with these options?:<br>'
      text = text + "<b>Project Name:</b> "+ document.getElementById("pname").value + '<br>'
      text = text + "<b>Project Desc:</b> "+ document.getElementById("pdescr").value + '<br>'
      text = text + "<b>Project Labels:</b> "+ document.getElementById("ctrl_name").value + ',' + real_labels + '<br>'
      p.innerHTML = text
      d.appendChild(p)

      let btn = document.createElement("button");
      btn.innerHTML = 'Coninue'
      btn.setAttribute("onclick", "enable_folders()")
      d.appendChild(btn)
      display_modal('info',d,'orange');
    }
}
function download(){
  form = document.getElementById('df_form');
  var formData = new FormData(form);
  console.log(formData.get('project'));
  var http = new XMLHttpRequest();
  http.responseType = 'blob';
  http.addEventListener("readystatechange", function() {
    if(this.readyState === 4) {
      var blob = new Blob([this.response]);
      //Create a link element, hide it, direct 
      //it towards the blob, and then 'click' it programatically
      let a = document.createElement("a");
      a.style = "display: none";
      document.body.appendChild(a);
      //Create a DOMString representing the blob 
      //and point the link element towards it
      let url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = formData.get('project_name')+'.pkl';
      //programatically click the link to trigger the download
      a.click();
      //release the reference to the file by revoking the Object URL
      window.URL.revokeObjectURL(url);
      close_model();
    }});
  http.open("POST", "/download");
  http.send(formData);
  
}


function down_options(project){
  let d = document.createElement("div");
  let p = document.createElement("p")
  p.innerHTML = 'Please select from the following options.'
  d.appendChild(p)
  let form = document.createElement("form");
  form.id = 'df_form';
  pro = document.createElement("input");
  pro.name = 'project'
  pro.value = project
  pro.innerHTML = project
  pro.style.display = 'none'
  form.appendChild(pro)

  f_name = document.createElement("label");
  f_name.innerHTML = 'File Name';
  form.appendChild(f_name)

  p_name = document.createElement("input");
  p_name.name = 'project_name'
  p_name.value = project.split('.')[0]
  p_name.innerHTML = project.split('.')[0]
  form.appendChild(p_name)
//  let d_options = document.createElement("label");
//  d_options.innerHTML = 'File Type';
//  form.appendChild(d_options)
//  let dir_select = document.createElement("select");
//  dir_select.name = 'file_type'
//
//  let opt0 = document.createElement("option");
//  opt0.innerHTML = "Pickle File"
//  opt0.value = "pkl"
//  opt0.title = "A pickle file with numpy contents."
//  dir_select.appendChild(opt0)
//
//  let opt1 = document.createElement("option");
//  opt1.innerHTML = "TF Record"
//  opt1.value = "tfr"
//  opt1.title = "A TF record with tensor-slices."
//  dir_select.appendChild(opt1)
//
//  form.appendChild(dir_select)
//
//  let p_f = document.createElement("p")
  //p_f.innerHTML = "A Pickle File will contain the data in it's raw form. Using this model requires more GPU memory,<br>"
  //p_f.innerHTML = p_f.innerHTML + "or it will take much longer to train the model. However, there is less manipulation of the images <br>during classification."
//  form.appendChild(p_f)
//
//  form.appendChild(document.createElement("br"))

  inc_files = document.createElement("label");
  inc_files.innerHTML = 'Include Images?';
  form.appendChild(inc_files)
  img_select = document.createElement("select");
  img_select.name = 'image_include'

  let opt_y = document.createElement("option");
  opt_y.innerHTML = "Yes"
  opt_y.value = "y"
  img_select.appendChild(opt_y)

  let opt_n = document.createElement("option");
  opt_n.innerHTML = "No"
  opt_n.value = "n"
  img_select.appendChild(opt_n)

  form.appendChild(img_select)
  let pmg = document.createElement("p")
  pmg.innerHTML = "Including the image data will make the file larger, but will be nessesary if you can't access the images<br>"
  pmg.innerHTML = pmg.innerHTML + " for training the model. Select yes if are running as a docker instance and did not set a Volume <br>during the deployment."
  form.appendChild(pmg)

  inc_control = document.createElement("label");
  inc_control.innerHTML = 'Include Control Group?';
  form.appendChild(inc_control)
  control_select = document.createElement("select");
  control_select.name = 'control_include';

  control_select.appendChild(opt_y.cloneNode(true))
  control_select.appendChild(opt_n.cloneNode(true))

  form.appendChild(control_select)
  let pctrl = document.createElement("p")
  pctrl.innerHTML = "Including the control data will make the fill larger, but will be nessesary if you can't access the images<br>"
  pctrl.innerHTML = pctrl.innerHTML + " for training the model. Select yes if are running as a docker instance and did not set a Volume <br>during the deployment."
  form.appendChild(pctrl)

  d.appendChild(form)
  d.appendChild(document.createElement("br"))

  let btn = document.createElement("button");
  btn.type = 'button'
  btn.innerHTML = 'Download'
  btn.setAttribute("onclick", "download('"+project+"')")
  d.appendChild(btn)
  let btn1 = document.createElement("button");
  btn1.type = 'button'
  btn1.innerHTML = 'Go Back'
  btn1.setAttribute("onclick", "open_close('modal')")
  d.appendChild(btn1) 

  display_modal('Download Options', d, 'blue')
}