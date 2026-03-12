package com.giovannip.noticeme.cucumber.stepdefs;

import static org.assertj.core.api.Assertions.assertThat;

import com.giovannip.noticeme.domain.Note;
import com.giovannip.noticeme.domain.Tag;
import com.giovannip.noticeme.domain.User;
import com.giovannip.noticeme.domain.enumeration.NoteStatus;
import com.giovannip.noticeme.repository.NoteRepository;
import com.giovannip.noticeme.repository.TagRepository;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;

@Transactional
@WithMockUser(username = "user")
public class GestioneNoteStepDefs extends StepDefs {

	@Autowired
    private EntityManager em;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private NoteRepository noteRepository;

    private Note notaCreata;
    private final Set<Tag> tagDaAssociare = new HashSet<>();

    @Before
    public void cleanScenarioState() {
        notaCreata = null;
        tagDaAssociare.clear();
    }

    @Given("l'utente autenticato ha creato i tag {string} e {string}")
    public void utenteHaCreatoITag(String nomeTag1, String nomeTag2) {
        Tag tag1 = creaTagSeAssente(nomeTag1);
        Tag tag2 = creaTagSeAssente(nomeTag2);

        tagDaAssociare.add(tag1);
        tagDaAssociare.add(tag2);
    }

    @When("crea una nota con titolo {string}")
    public void creaUnaNotaConTitolo(String titolo) {
        User owner = getOrCreateUser("user");

        Note note = new Note()
            .title(titolo)
            .content("contenuto di test")
            .status(NoteStatus.NORMAL)
            .owner(owner);

        notaCreata = noteRepository.saveAndFlush(note);
    }

    @When("associa i tag {string} e {string}")
    public void associaITag(String nomeTag1, String nomeTag2) {
        assertThat(notaCreata).isNotNull();

        Tag tag1 = tagRepository.findOneByTagNameAndOwnerLogin(nomeTag1, "user").orElseThrow();
        Tag tag2 = tagRepository.findOneByTagNameAndOwnerLogin(nomeTag2, "user").orElseThrow();

        notaCreata.addTag(tag1);
        notaCreata.addTag(tag2);

        notaCreata = noteRepository.saveAndFlush(notaCreata);
        em.clear();
    }

    @Then("la nota deve essere salvata con 2 tag associati")
    public void verificaNotaSalvataConDueTagAssociati() {
        assertThat(notaCreata).isNotNull();

        Note notePersisted = noteRepository.findOneWithEagerRelationships(notaCreata.getId()).orElseThrow();

        assertThat(notePersisted.getTags()).hasSize(2);
        assertThat(notePersisted.getTags())
            .extracting(Tag::getTagName)
            .containsExactlyInAnyOrder("Studio", "Lavoro");
    }

    private Tag creaTagSeAssente(String nomeTag) {
        Optional<Tag> existing = tagRepository.findOneByTagNameAndOwnerLogin(nomeTag, "user");
        if (existing.isPresent()) {
            return existing.orElseThrow();
        }

        User owner = getOrCreateUser("user");

        Tag tag = new Tag()
            .tagName(nomeTag)
            .color("blue")
            .owner(owner);

        return tagRepository.saveAndFlush(tag);
    }

    private User getOrCreateUser(String login) {
        return em.createQuery("select u from User u where u.login = :login", User.class)
            .setParameter("login", login)
            .getResultStream()
            .findFirst()
            .orElseGet(() -> {
                User user = new User();
                user.setLogin(login);
                user.setPassword("password");
                user.setActivated(true);
                user.setEmail(login + "@example.com");
                user.setFirstName("Test");
                user.setLastName("User");
                user.setImageUrl("");
                user.setLangKey("it");
                em.persist(user);
                em.flush();
                return user;
            });
    }
}
