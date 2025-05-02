function edit_labels(section) {
  let elm, btn, ae;
  if (section == 'custom'){
    elm = document.querySelector("[name='labels']");
    btn = document.querySelector("[id='edit_labels']");
    ae = elm.value.split(',')    
  } else if (section == 'control'){
    elm = document.querySelector("[name='ctrl_name']");
    btn = document.querySelector("[id='edit_control']");
    ae = elm.value
  }

  btn.innerHTML = 'Update'
  btn.onclick = function() {update_labels(section)};
  elm.value = ae;
  elm.disabled = false;

}

function update_labels(section){
  let elm, btn, au;
  if (section == 'custom'){
    elm = document.querySelector("[name='labels']");
    btn = document.querySelector("[id='edit_labels']");
    au = elm.value.split(',');
    au.sort();
  } else if (section == 'control'){
    elm = document.querySelector("[name='ctrl_name']");
    btn = document.querySelector("[id='edit_control']");
    au = elm.value
  }

  elm.value = au;
  elm.disabled = true;
  btn.innerHTML = 'Edit'
  btn.onclick = function() {edit_labels(section)};
}
console.log('Loaded JS')