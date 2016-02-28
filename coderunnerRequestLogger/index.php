<!DOCTYPE html>
<html>

    <head>
        <meta charset="UTF-8">
        <title>Coderunner Log Viewer</title>
        <link rel="stylesheet" href="css/style.css">
    </head>

    <body>
    <?php 
        require 'config.php';
        require 'preview.php';

        if (isset($_GET['secret']) && $_GET['secret'] == ADMIN_SECRET) {

            if (isset($_GET['file'])) {
                previewFile($_GET['file']);
            } else if (isset($_GET['dir'])) {
                previewDir($_GET['dir']);
            } else {
                previewRoot();
            }

        } else {
            previewLogin();
        }
    ?>
    </body>
</html>
