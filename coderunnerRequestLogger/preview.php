<?php

function previewRoot() {
	echo '<table><thead><tr><th>#</th><th colspan="2">Logging date</th></tr></thead>';
	$directories = glob('logs/*' , GLOB_ONLYDIR);
	$params = array(
		'secret' => SERVER_SECRET,
		'dir' => ''
	);
	foreach ($directories as $idx => $dir) {
		$params['dir'] = $dir;
		$query = http_build_query($params);
		$href = '?'.$query;
		echo "<tr><td>$idx</td><td><a href=\"$href\">$dir</a></td><td><i class=\"fa fa-trash button excluir\"></i></td></tr>";
	}
	echo '</tbody></table>';
}


function previewFile($file_name) {
	echo '<table><thead><tr><th colspan="3">'.$file_name.'</th></tr><tr><th>param</th><th colspan="2">Value</th></tr></thead>';
	$obj = json_decode(file_get_contents($file_name));
	foreach ($obj as $param => $value) {
		echo "<tr><td>$param</td><td>$value</td><td><i class=\"fa fa-trash button excluir\"></i></td></tr>";

	}
	echo '</tbody></table>';
}

function previewDir($dir_name) {
	echo '<table><thead><tr><th>#</th><th colspan="2">Request Log Time</th></tr></thead>';
	$files = glob($dir_name.'/*');
	$params = array(
		'secret' => SERVER_SECRET,
		'file' => ''
	);
	foreach ($files as $idx => $file) {
		$params['file'] = $file;
		$query = http_build_query($params);
		$href = '?'.$query;
		echo "<tr><td>$idx</td><td><a href=\"$href\">$file</a></td><td><i class=\"fa fa-trash button excluir\"></i></td></tr>";
	}
	echo '</tbody></table>';
}

function previewLogin() {
	?>
    <div class="login">
        <div class="login-screen">
            <div class="app-title">
                <h1>Login</h1>
            </div>

            <form method="GET" class="login-form">

                <div class="control-group">
                <input type="password" name="secret" class="login-field" value="" placeholder="secret key" id="login-pass">
                <label class="login-field-icon fui-lock" for="login-pass"></label>
                </div>

                <input type="submit" class="btn btn-primary btn-large btn-block" name="" value="login">
            </form>
        </div>
    </div>
    <?php
}

?>
  