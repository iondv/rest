# Sending requests with files in the CRUD service

There are two ways to send and receive files:

* data is accepted in the `json` format, then the content of the file is transferred as a string in the  *Base64* format
* data is accepted as `FormData` (application/x-www-form-urlencoded), then files are transferred as *multipart*

Correct reception of file attributes in case of sending such requests is carried out by the following methods: `POST`, `PUT` and `PATCH` in CRUD service.


It is also possible to transfer links and collections according to the example described for [soap module](https://github.com/iondv/soap).

