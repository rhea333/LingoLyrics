package ca.lingolyrics.ankidroid

import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.text.TextUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** Uses the public AnkiDroid ContentProvider contract, including parallel builds.
 * https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-API
 * No collection database files are accessed directly.
 */
class AnkiDroidModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val packages = listOf("com.ichi2.anki", "com.ichi2.anki.a", "com.ichi2.anki.b", "com.ichi2.anki.c")
    private val deckName = "LingoLyrics PoC"
    private val modelName = "LingoLyrics Vocabulary"
    private val fieldNames = "Term\u001fTranslation\u001fContext"
    private val resolver get() = context.contentResolver
    override fun getName() = "LingoLyricsAnkiDroid"

    private fun authority(packageName: String): Uri {
        require(packageName in packages) { "Unsupported AnkiDroid application" }
        return Uri.parse("content://$packageName.flashcards")
    }
    // AnkiDroid 2.25.3's provider checks the base API permission even in
    // parallel builds. Keep the regular app installed to define the permission;
    // all data operations still use the selected parallel app's authority.
    private fun permission(packageName: String): String {
        authority(packageName)
        return "com.ichi2.anki.permission.READ_WRITE_DATABASE"
    }
    private fun uri(packageName: String, path: String) = Uri.withAppendedPath(authority(packageName), path)
    private fun availablePackage(): String? = packages.firstOrNull {
        context.packageManager.resolveContentProvider("$it.flashcards", 0) != null &&
            runCatching { resolver.getType(uri(it, "decks")) != null }.getOrDefault(false)
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        try {
            val target = availablePackage()
            promise.resolve(Arguments.createMap().apply {
                putBoolean("available", target != null)
                if (target != null) {
                    putString("packageName", target)
                    putString("permission", permission(target))
                    putString("label", if (target == "com.ichi2.anki") "AnkiDroid" else "AnkiDroid.${target.last().uppercaseChar()}")
                    putBoolean("granted", context.checkSelfPermission(permission(target)) == PackageManager.PERMISSION_GRANTED)
                }
            })
        } catch (error: Exception) {
            promise.reject("ANKIDROID_STATUS", error.message, error)
        }
    }

    private fun deck(packageName: String): Long {
        resolver.query(uri(packageName, "decks"), arrayOf("deck_id", "deck_name"), null, null, null)?.use { rows ->
            while (rows.moveToNext()) if (rows.getString(1) == deckName) return rows.getLong(0)
        }
        val created = resolver.insert(uri(packageName, "decks"), ContentValues().apply { put("deck_name", deckName) })
        return requireNotNull(created?.lastPathSegment?.toLongOrNull()) { "AnkiDroid could not create the test deck" }
    }

    private fun model(packageName: String, deckId: Long): Long {
        resolver.query(uri(packageName, "models"), arrayOf("_id", "name", "field_names"), null, null, null)?.use { rows ->
            while (rows.moveToNext()) if (rows.getString(1) == modelName) {
                check(rows.getString(2) == fieldNames) { "The LingoLyrics note type has different fields; restore Term, Translation, Context" }
                return rows.getLong(0)
            }
        }
        val created = requireNotNull(resolver.insert(uri(packageName, "models"), ContentValues().apply {
            put("name", modelName)
            put("field_names", fieldNames)
            put("num_cards", 1)
            put("deck_id", deckId)
            put("css", ".card { font-family: sans-serif; font-size: 24px; text-align: center; } .context { margin-top: 20px; }")
        })) { "AnkiDroid could not create the vocabulary note type" }
        val updated = resolver.update(Uri.withAppendedPath(created, "templates/0"), ContentValues().apply {
            put("card_template_name", "Vocabulary")
            put("question_format", "{{Term}}")
            put("answer_format", "{{FrontSide}}<hr id=answer>{{Translation}}<div class=context>{{Context}}</div>")
        }, null, null)
        check(updated > 0) { "AnkiDroid could not configure the vocabulary card" }
        return requireNotNull(created.lastPathSegment?.toLongOrNull())
    }

    private fun hasCardInDeck(noteUri: Uri, deckId: Long): Boolean {
        resolver.query(Uri.withAppendedPath(noteUri, "cards"), arrayOf("ord", "deck_id"), null, null, null)?.use { rows ->
            while (rows.moveToNext()) if (rows.getLong(1) == deckId) return true
        }
        return false
    }

    @ReactMethod
    fun addNote(packageName: String, term: String, translation: String, lyricContext: String, promise: Promise) {
        try {
            require(listOf(term, translation, lyricContext).all { it.isNotBlank() }) { "Term, translation, and context are required" }
            authority(packageName)
            check(context.checkSelfPermission(permission(packageName)) == PackageManager.PERMISSION_GRANTED) {
                "Allow LingoLyrics to access AnkiDroid before sending a card"
            }
            val fields = listOf(term, translation, lyricContext).joinToString("\u001f") {
                TextUtils.htmlEncode(it.trim()).replace("\n", "<br>")
            }
            val deckId = deck(packageName)
            val modelId = model(packageName, deckId)
            var noteUri: Uri? = null
            // Search only this app's tagged notes and compare all fields for safe repeated demos.
            resolver.query(uri(packageName, "notes"), arrayOf("_id", "mid", "flds"), "tag:lingolyrics", null, null)?.use { rows ->
                while (rows.moveToNext()) {
                    if (rows.getLong(1) == modelId && rows.getString(2) == fields) {
                        val candidate = uri(packageName, "notes/${rows.getLong(0)}")
                        if (hasCardInDeck(candidate, deckId)) { noteUri = candidate; break }
                    }
                }
            }
            val alreadyExists = noteUri != null
            if (noteUri == null) {
                noteUri = requireNotNull(resolver.insert(uri(packageName, "notes"), ContentValues().apply {
                    put("mid", modelId)
                    put("flds", fields)
                    put("tags", " lingolyrics poc-r3 ")
                })) { "AnkiDroid did not create the note" }
                resolver.query(Uri.withAppendedPath(noteUri!!, "cards"), arrayOf("ord"), null, null, null)?.use { rows ->
                    while (rows.moveToNext()) {
                        resolver.update(Uri.withAppendedPath(noteUri!!, "cards/${rows.getInt(0)}"), ContentValues().apply {
                            put("deck_id", deckId)
                        }, null, null)
                    }
                }
            }
            val savedUri = requireNotNull(noteUri)
            val verified = resolver.query(savedUri, arrayOf("flds"), null, null, null)?.use {
                it.moveToFirst() && it.getString(0) == fields
            } ?: false
            check(verified && hasCardInDeck(savedUri, deckId)) { "The saved note could not be verified in the intended deck" }
            promise.resolve(Arguments.createMap().apply {
                putString("noteId", savedUri.lastPathSegment)
                putString("deckName", deckName)
                putString("packageName", packageName)
                putBoolean("alreadyExists", alreadyExists)
                putBoolean("verified", true)
            })
        } catch (error: SecurityException) {
            promise.reject("ANKIDROID_PERMISSION", "AnkiDroid access was denied. Allow access in Android settings and try again.", error)
        } catch (error: Exception) {
            promise.reject("ANKIDROID_SEND", "${error.message}. Open AnkiDroid and finish its setup, then try again.", error)
        }
    }

    @ReactMethod
    fun openApp(packageName: String, promise: Promise) {
        try {
            authority(packageName)
            val intent = requireNotNull(context.packageManager.getLaunchIntentForPackage(packageName)) { "AnkiDroid is not installed" }
            context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("ANKIDROID_OPEN", error.message, error)
        }
    }
}
