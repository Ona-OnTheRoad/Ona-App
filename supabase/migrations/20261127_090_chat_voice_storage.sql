-- Chat voice notes live in Storage, not inside messages.body.
--
-- The send route caps a message body at 4000 characters, and a base64 voice
-- recording is far larger, so every voice note was rejected (and then vanished
-- from the sender's screen). Audio is now uploaded to this bucket by
-- POST /api/messages/voice, and messages.body only carries a small JSON
-- pointer: {"text", "voiceKey", "voiceDurationSec", "voiceMime"}.
--
-- The bucket is PRIVATE. Chats are private between a customer and a pro, so
-- there is no public read and no client policy: only the service role (the API
-- routes) reads or writes. GET /api/conversations hands the conversation's
-- two members short-lived signed URLs.
--
-- Object key layout: <conversation_id>/<sender_id>/<random>.<ext>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-voice',
  'chat-voice',
  false,
  3145728, -- 3 MB
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/x-m4a']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Service role manage chat voice" on storage.objects;
create policy "Service role manage chat voice"
  on storage.objects for all
  to service_role
  using (bucket_id = 'chat-voice')
  with check (bucket_id = 'chat-voice');
